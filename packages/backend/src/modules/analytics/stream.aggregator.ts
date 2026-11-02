/**
 * BREAKING NEWS WALA — Redis Stream Telemetry Aggregator
 * Grounded in docs/Analytics.md (Section 3, Section 22: Redis Stream Ingress),
 * docs/DECISIONS.md (DEC-014, DEC-021), and prompt Section 6.
 */

import { ANALYTICS_LIMITS, STREAM_CONFIG } from './analytics.constants';
import { EnrichedAnalyticsEvent, RawStreamMessage, StreamStats } from './types';
import { logger } from '../../middleware/structured-logger';

export interface IRedisStreamAggregator {
  publishEvent(event: EnrichedAnalyticsEvent): Promise<string>;
  createConsumerGroup(groupName: string): Promise<boolean>;
  readGroup(groupName: string, consumerName: string, count?: number): Promise<RawStreamMessage[]>;
  ackMessage(groupName: string, messageId: string): Promise<boolean>;
  readPending(groupName: string, consumerName: string, minIdleTimeMs?: number): Promise<RawStreamMessage[]>;
  getStats(groupName?: string): Promise<StreamStats>;
  processBatch(
    groupName: string,
    consumerName: string,
    handler: (event: EnrichedAnalyticsEvent) => Promise<void>,
    batchSize?: number
  ): Promise<{ processed: number; failed: number }>;
  recoverPending(
    groupName: string,
    consumerName: string,
    handler: (event: EnrichedAnalyticsEvent) => Promise<void>,
    minIdleTimeMs?: number
  ): Promise<{ recovered: number; failed: number }>;
  shutdown(): Promise<void>;
}

/**
 * Resilient In-Memory Redis Stream Aggregator
 * Provides full-fidelity Redis Stream mechanics (XADD, XGROUP CREATE, XREADGROUP, XACK, XPENDING, XCLAIM)
 * for offline development, local unit/integration tests, and Redis failover.
 */
export class InMemoryRedisStreamAggregator implements IRedisStreamAggregator {
  private messages: RawStreamMessage[] = [];
  private sequenceCounter = 0;
  private isShutdown = false;

  // Group Name -> Group State
  private groups = new Map<
    string,
    {
      lastDeliveredIndex: number;
      pendingList: Map<string, { message: RawStreamMessage; deliveredAt: number; attempts: number; consumerName: string }>;
      acknowledgedIds: Set<string>;
    }
  >();

  // Dead Letter storage for unprocessable messages
  public deadLetterQueue: Array<{ messageId: string; event: EnrichedAnalyticsEvent; reason: string }> = [];

  constructor(
    private readonly defaultGroup: string = STREAM_CONFIG.CONSUMER_GROUP,
    private readonly defaultConsumer: string = STREAM_CONFIG.CONSUMER_NAME
  ) {
    this.createConsumerGroup(this.defaultGroup);
  }

  /**
   * Publishes event to stream (XADD).
   */
  public async publishEvent(event: EnrichedAnalyticsEvent): Promise<string> {
    if (this.isShutdown) {
      throw new Error('Stream aggregator is shut down. Cannot accept new events.');
    }

    const messageId = `${Date.now()}-${this.sequenceCounter++}`;
    const rawMessage: RawStreamMessage = {
      id: messageId,
      event,
      deliveredCount: 0,
      lastDeliveredAt: new Date(),
    };

    this.messages.push(rawMessage);
    return messageId;
  }

  /**
   * Creates a consumer group (XGROUP CREATE).
   */
  public async createConsumerGroup(groupName: string): Promise<boolean> {
    if (!this.groups.has(groupName)) {
      this.groups.set(groupName, {
        lastDeliveredIndex: 0,
        pendingList: new Map(),
        acknowledgedIds: new Set(),
      });
      return true;
    }
    return false;
  }

  /**
   * Reads unread messages for consumer group (XREADGROUP ... >).
   */
  public async readGroup(
    groupName: string,
    consumerName: string = this.defaultConsumer,
    count: number = 20
  ): Promise<RawStreamMessage[]> {
    if (this.isShutdown) return [];

    let group = this.groups.get(groupName);
    if (!group) {
      await this.createConsumerGroup(groupName);
      group = this.groups.get(groupName)!;
    }

    const unread = this.messages.slice(group.lastDeliveredIndex, group.lastDeliveredIndex + count);
    if (unread.length === 0) return [];

    const now = Date.now();
    for (const msg of unread) {
      msg.deliveredCount++;
      msg.lastDeliveredAt = new Date(now);

      // Add to group's Pending Entry List (PEL)
      group.pendingList.set(msg.id, {
        message: msg,
        deliveredAt: now,
        attempts: 1,
        consumerName,
      });
    }

    group.lastDeliveredIndex += unread.length;
    return unread;
  }

  /**
   * Acknowledges message after successful processing (XACK).
   */
  public async ackMessage(groupName: string, messageId: string): Promise<boolean> {
    const group = this.groups.get(groupName);
    if (!group) return false;

    if (group.pendingList.has(messageId)) {
      group.pendingList.delete(messageId);
      group.acknowledgedIds.add(messageId);
      return true;
    }

    return false;
  }

  /**
   * Reads pending messages that have not been acknowledged (XPENDING / XCLAIM).
   */
  public async readPending(
    groupName: string,
    _consumerName: string = this.defaultConsumer,
    minIdleTimeMs: number = ANALYTICS_LIMITS.STREAM_RECOVERY_IDLE_TIME_MS
  ): Promise<RawStreamMessage[]> {
    const group = this.groups.get(groupName);
    if (!group) return [];

    const now = Date.now();
    const recoverable: RawStreamMessage[] = [];

    for (const entry of group.pendingList.values()) {
      const idleTime = now - entry.deliveredAt;
      if (idleTime >= minIdleTimeMs) {
        entry.attempts++;
        entry.deliveredAt = now;
        recoverable.push(entry.message);
      }
    }

    return recoverable;
  }

  /**
   * Returns current stream statistics.
   */
  public async getStats(groupName: string = this.defaultGroup): Promise<StreamStats> {
    const group = this.groups.get(groupName);
    return {
      streamLength: this.messages.length,
      consumerGroup: groupName,
      pendingCount: group ? group.pendingList.size : 0,
      acknowledgedCount: group ? group.acknowledgedIds.size : 0,
    };
  }

  /**
   * Processes a batch of events with strict acknowledgement order:
   * Only calls ackMessage if handler completes successfully.
   */
  public async processBatch(
    groupName: string = this.defaultGroup,
    consumerName: string = this.defaultConsumer,
    handler: (event: EnrichedAnalyticsEvent) => Promise<void>,
    batchSize: number = 20
  ): Promise<{ processed: number; failed: number }> {
    const messages = await this.readGroup(groupName, consumerName, batchSize);
    let processed = 0;
    let failed = 0;

    for (const msg of messages) {
      try {
        await handler(msg.event);
        await this.ackMessage(groupName, msg.id);
        processed++;
      } catch (err: any) {
        logger.error(`[AnalyticsStream] Failed to process message "${msg.id}": ${err.message}`);
        failed++;
        // Message remains in PEL for pending recovery
      }
    }

    return { processed, failed };
  }

  /**
   * Recovers pending messages and re-executes handler.
   * If max delivery attempts exceeded, safely routes to dead letter storage.
   */
  public async recoverPending(
    groupName: string = this.defaultGroup,
    consumerName: string = this.defaultConsumer,
    handler: (event: EnrichedAnalyticsEvent) => Promise<void>,
    minIdleTimeMs: number = 0 // Immediate for tests
  ): Promise<{ recovered: number; failed: number }> {
    const pendingMessages = await this.readPending(groupName, consumerName, minIdleTimeMs);
    let recovered = 0;
    let failed = 0;

    const group = this.groups.get(groupName);

    for (const msg of pendingMessages) {
      const entry = group?.pendingList.get(msg.id);
      if (entry && entry.attempts > ANALYTICS_LIMITS.MAX_DELIVERY_ATTEMPTS) {
        logger.warn(`[AnalyticsStream] Message "${msg.id}" exceeded max attempts (${entry.attempts}). Routing to Dead Letter Queue.`);
        this.deadLetterQueue.push({
          messageId: msg.id,
          event: msg.event,
          reason: 'MAX_DELIVERY_ATTEMPTS_EXCEEDED',
        });
        await this.ackMessage(groupName, msg.id); // Acknowledge from primary stream after dead-lettering
        continue;
      }

      try {
        await handler(msg.event);
        await this.ackMessage(groupName, msg.id);
        recovered++;
      } catch (err: any) {
        logger.error(`[AnalyticsStream] Pending recovery failed for message "${msg.id}": ${err.message}`);
        failed++;
      }
    }

    return { recovered, failed };
  }

  public async shutdown(): Promise<void> {
    this.isShutdown = true;
    logger.info('[AnalyticsStream] Stream aggregator gracefully shut down.');
  }

  public clear(): void {
    this.messages = [];
    this.sequenceCounter = 0;
    this.isShutdown = false;
    this.deadLetterQueue = [];
    this.groups.clear();
    this.createConsumerGroup(this.defaultGroup);
  }
}

let streamAggregatorInstance: IRedisStreamAggregator | null = null;

export function getStreamAggregator(): IRedisStreamAggregator {
  if (!streamAggregatorInstance) {
    streamAggregatorInstance = new InMemoryRedisStreamAggregator();
  }
  return streamAggregatorInstance;
}

export function setStreamAggregator(aggregator: IRedisStreamAggregator): void {
  streamAggregatorInstance = aggregator;
}

export const streamAggregator = {
  get instance(): IRedisStreamAggregator {
    return getStreamAggregator();
  },
};
