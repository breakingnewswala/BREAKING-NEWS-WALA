/**
 * BREAKING NEWS WALA — Notification Dispatch Queue
 * Grounded in docs/11-Architecture.md (Redis / BullMQ Queue Engine),
 * docs/DECISIONS.md (DEC-015), and prompt Section 11.
 */

import { logger } from '../../middleware/structured-logger';
import { DispatchJob } from './types';

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export type JobHandler = (job: DispatchJob) => Promise<void>;

/**
 * Resilient Asynchronous Notification Queue
 * Enforces exponential backoff retries, idempotency, maximum attempts, and observability.
 */
export class NotificationQueue {
  private readonly waitingJobs: DispatchJob[] = [];
  private readonly activeJobs: Map<string, DispatchJob> = new Map();
  private readonly completedJobs: Map<string, DispatchJob> = new Map();
  private readonly failedJobs: Map<string, { job: DispatchJob; error: string; failedAt: Date }> = new Map();
  private readonly processedJobIds: Set<string> = new Set(); // Idempotency ledger
  private pendingRetriesCount = 0;

  private handler: JobHandler | null = null;
  private isProcessing = false;
  private isShutdown = false;

  constructor(
    private readonly defaultMaxAttempts: number = 3,
    private readonly baseRetryDelayMs: number = 50 // Fast retry for tests/local
  ) {}

  public registerHandler(handler: JobHandler): void {
    this.handler = handler;
  }

  /**
   * Enqueues a notification job with idempotency deduplication.
   */
  public async enqueue(job: Omit<DispatchJob, 'attempts' | 'status' | 'createdAt' | 'maxAttempts'> & { maxAttempts?: number }): Promise<boolean> {
    if (this.isShutdown) {
      throw new Error('NotificationQueue is shut down. Cannot accept new jobs.');
    }

    // Idempotency check: if already processed or waiting, reject duplicate
    if (this.processedJobIds.has(job.id)) {
      logger.warn(`[Queue] Dropping duplicate notification dispatch job "${job.id}".`);
      return false;
    }

    const fullJob: DispatchJob = {
      ...job,
      attempts: 0,
      maxAttempts: job.maxAttempts || this.defaultMaxAttempts,
      status: 'pending',
      createdAt: new Date(),
    };

    this.waitingJobs.push(fullJob);
    this.processedJobIds.add(job.id);

    // Trigger processing
    this.processNextJobs();
    return true;
  }

  private async processNextJobs(): Promise<void> {
    if (this.isProcessing || this.isShutdown || !this.handler) return;
    this.isProcessing = true;

    try {
      while (this.waitingJobs.length > 0 && !this.isShutdown) {
        const job = this.waitingJobs.shift();
        if (!job) break;

        this.activeJobs.set(job.id, job);
        job.status = 'processing';
        job.attempts += 1;

        try {
          await this.handler(job);
          job.status = 'completed';
          this.activeJobs.delete(job.id);
          this.completedJobs.set(job.id, job);
        } catch (err: any) {
          const errorMessage = err?.message || 'Unknown queue processing error';
          logger.warn(`[Queue] Job "${job.id}" attempt ${job.attempts}/${job.maxAttempts} failed: ${errorMessage}`);

          if (job.attempts < job.maxAttempts) {
            // Calculate exponential backoff delay: base * 2^(attempts - 1)
            const delay = this.baseRetryDelayMs * Math.pow(2, job.attempts - 1);
            job.status = 'pending';
            this.activeJobs.delete(job.id);
            this.pendingRetriesCount += 1;

            // Re-enqueue after backoff
            setTimeout(() => {
              this.pendingRetriesCount = Math.max(0, this.pendingRetriesCount - 1);
              if (!this.isShutdown) {
                this.waitingJobs.push(job);
                this.processNextJobs();
              }
            }, delay);
          } else {
            // Permanent failure
            job.status = 'failed';
            job.error = errorMessage;
            this.activeJobs.delete(job.id);
            this.failedJobs.set(job.id, { job, error: errorMessage, failedAt: new Date() });
            logger.error(`[Queue] Job "${job.id}" permanently failed after ${job.attempts} attempts.`);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  public getStats(): QueueStats {
    return {
      waiting: this.waitingJobs.length,
      active: this.activeJobs.size,
      completed: this.completedJobs.size,
      failed: this.failedJobs.size,
    };
  }

  public getFailedJobs(): Array<{ job: DispatchJob; error: string; failedAt: Date }> {
    return Array.from(this.failedJobs.values());
  }

  public isJobCompleted(jobId: string): boolean {
    return this.completedJobs.has(jobId);
  }

  public isJobFailed(jobId: string): boolean {
    return this.failedJobs.has(jobId);
  }

  /**
   * Waits for all active and waiting jobs to complete (useful in tests).
   */
  public async drain(timeoutMs: number = 3000): Promise<void> {
    const startTime = Date.now();
    while (this.waitingJobs.length > 0 || this.activeJobs.size > 0 || this.pendingRetriesCount > 0) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Queue drain timed out after ${timeoutMs}ms.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  public shutdown(): void {
    this.isShutdown = true;
    this.waitingJobs.length = 0;
    this.activeJobs.clear();
    this.pendingRetriesCount = 0;
  }

  public clear(): void {
    this.waitingJobs.length = 0;
    this.activeJobs.clear();
    this.completedJobs.clear();
    this.failedJobs.clear();
    this.processedJobIds.clear();
    this.pendingRetriesCount = 0;
    this.isShutdown = false;
    this.isProcessing = false;
  }
}

export const notificationQueue = new NotificationQueue();
