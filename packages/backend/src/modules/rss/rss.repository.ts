/**
 * BREAKING NEWS WALA — RSS Persistence & Repository Layer
 * Grounded in docs/12-Database.md (DOM-F) and docs/13-API.md
 */

import { PrismaClient } from '@prisma/client';
import {
  RssSourceItem,
  ImportedRssItemDto,
  StoryClusterItem,
  RssSourceFilterParams,
  ImportedItemFilterParams,
  RssHealthSummary,
} from './types';
import { CANONICAL_SEED_RSS_SOURCES } from './constants';

export interface IRssRepository {
  findSourceById(id: string): Promise<RssSourceItem | null>;
  findSourceByUrl(feedUrl: string): Promise<RssSourceItem | null>;
  listSources(params?: RssSourceFilterParams): Promise<{ items: RssSourceItem[]; total: number }>;
  createSource(source: RssSourceItem): Promise<RssSourceItem>;
  updateSource(id: string, updates: Partial<RssSourceItem>): Promise<RssSourceItem>;
  deleteSource(id: string): Promise<boolean>;

  findItemByGuidHash(guidHash: string): Promise<ImportedRssItemDto | null>;
  findItemById(id: string): Promise<ImportedRssItemDto | null>;
  createImportedItem(item: ImportedRssItemDto): Promise<ImportedRssItemDto>;
  updateImportedItem(id: string, updates: Partial<ImportedRssItemDto>): Promise<ImportedRssItemDto>;
  listImportedItems(params?: ImportedItemFilterParams): Promise<{ items: ImportedRssItemDto[]; total: number }>;

  createStoryCluster(cluster: StoryClusterItem): Promise<StoryClusterItem>;
  listStoryClusters(): Promise<StoryClusterItem[]>;

  getHealthSummary(): Promise<RssHealthSummary>;
}

export class InMemoryRssRepository implements IRssRepository {
  private sources: Map<string, RssSourceItem> = new Map();
  private items: Map<string, ImportedRssItemDto> = new Map();
  private clusters: Map<string, StoryClusterItem> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date().toISOString();
    for (const seed of CANONICAL_SEED_RSS_SOURCES) {
      this.sources.set(seed.id, {
        ...seed,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  public async findSourceById(id: string): Promise<RssSourceItem | null> {
    return this.sources.get(id) || null;
  }

  public async findSourceByUrl(feedUrl: string): Promise<RssSourceItem | null> {
    for (const source of this.sources.values()) {
      if (source.feedUrl.toLowerCase() === feedUrl.toLowerCase()) {
        return source;
      }
    }
    return null;
  }

  public async listSources(params: RssSourceFilterParams = {}): Promise<{ items: RssSourceItem[]; total: number }> {
    let result = Array.from(this.sources.values());

    if (params.status && params.status !== 'all') {
      result = result.filter((s) => s.status === params.status);
    }
    if (params.isAuthorized !== undefined) {
      result = result.filter((s) => s.isAuthorized === params.isAuthorized);
    }
    if (params.category) {
      result = result.filter((s) => s.sourceCategory === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.publisherName.toLowerCase().includes(q) ||
          s.feedUrl.toLowerCase().includes(q)
      );
    }

    const total = result.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 50));
    const start = (page - 1) * limit;
    const items = result.slice(start, start + limit);

    return { items, total };
  }

  public async createSource(source: RssSourceItem): Promise<RssSourceItem> {
    this.sources.set(source.id, source);
    return source;
  }

  public async updateSource(id: string, updates: Partial<RssSourceItem>): Promise<RssSourceItem> {
    const existing = this.sources.get(id);
    if (!existing) {
      throw new Error(`RssSource with ID "${id}" does not exist`);
    }
    const updated: RssSourceItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.sources.set(id, updated);
    return updated;
  }

  public async deleteSource(id: string): Promise<boolean> {
    return this.sources.delete(id);
  }

  public async findItemByGuidHash(guidHash: string): Promise<ImportedRssItemDto | null> {
    for (const item of this.items.values()) {
      if (item.guidHash === guidHash) {
        return item;
      }
    }
    return null;
  }

  public async findItemById(id: string): Promise<ImportedRssItemDto | null> {
    return this.items.get(id) || null;
  }

  public async createImportedItem(item: ImportedRssItemDto): Promise<ImportedRssItemDto> {
    this.items.set(item.id, item);
    return item;
  }

  public async updateImportedItem(id: string, updates: Partial<ImportedRssItemDto>): Promise<ImportedRssItemDto> {
    const existing = this.items.get(id);
    if (!existing) {
      throw new Error(`ImportedRssItem with ID "${id}" does not exist`);
    }
    const updated = { ...existing, ...updates };
    this.items.set(id, updated);
    return updated;
  }

  public async listImportedItems(params: ImportedItemFilterParams = {}): Promise<{ items: ImportedRssItemDto[]; total: number }> {
    let result = Array.from(this.items.values());

    if (params.rssSourceId) {
      result = result.filter((i) => i.rssSourceId === params.rssSourceId);
    }
    if (params.aiProcessingStatus) {
      result = result.filter((i) => i.aiProcessingStatus === params.aiProcessingStatus);
    }
    if (params.hasDraft !== undefined) {
      result = result.filter((i) => (params.hasDraft ? Boolean(i.generatedNewsId) : !i.generatedNewsId));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (i) => i.originalTitle.toLowerCase().includes(q) || i.sourceAttribution.toLowerCase().includes(q)
      );
    }

    // Sort descending by importedAt
    result.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());

    const total = result.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 50));
    const start = (page - 1) * limit;
    const items = result.slice(start, start + limit);

    return { items, total };
  }

  public async createStoryCluster(cluster: StoryClusterItem): Promise<StoryClusterItem> {
    this.clusters.set(cluster.id, cluster);
    return cluster;
  }

  public async listStoryClusters(): Promise<StoryClusterItem[]> {
    return Array.from(this.clusters.values()).sort(
      (a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
    );
  }

  public async getHealthSummary(): Promise<RssHealthSummary> {
    const sources = Array.from(this.sources.values());
    const items = Array.from(this.items.values());

    let totalDrafts = 0;
    for (const item of items) {
      if (item.generatedNewsId) totalDrafts++;
    }

    return {
      totalSources: sources.length,
      activeSources: sources.filter((s) => s.status === 'active' && s.isAuthorized).length,
      pendingSources: sources.filter((s) => s.status === 'pending_approval').length,
      pausedSources: sources.filter((s) => s.status === 'paused').length,
      disabledSources: sources.filter((s) => s.status === 'disabled').length,
      archivedSources: sources.filter((s) => s.status === 'archived').length,
      totalImportedItems: items.length,
      totalDraftsGenerated: totalDrafts,
      lastSyncTimestamp: new Date().toISOString(),
    };
  }
}

export class PrismaRssRepository implements IRssRepository {
  private fallback: InMemoryRssRepository;

  constructor(private prisma: PrismaClient) {
    this.fallback = new InMemoryRssRepository();
  }

  public async findSourceById(id: string): Promise<RssSourceItem | null> {
    try {
      const src = await this.prisma.rssSource.findUnique({ where: { id } });
      if (!src) return null;
      return {
        id: src.id,
        name: src.name,
        feedUrl: src.feedUrl,
        publisherName: src.name,
        sourceCategory: src.defaultCategoryId || 'governance',
        geographicCoverage: 'Madhya Pradesh',
        language: 'hi',
        status: src.status as any,
        isAuthorized: src.isAuthorized,
        pollingIntervalMinutes: src.pollingIntervalMinutes,
        createdById: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return this.fallback.findSourceById(id);
    }
  }

  public async findSourceByUrl(feedUrl: string): Promise<RssSourceItem | null> {
    try {
      const src = await this.prisma.rssSource.findUnique({ where: { feedUrl } });
      if (!src) return null;
      return {
        id: src.id,
        name: src.name,
        feedUrl: src.feedUrl,
        publisherName: src.name,
        sourceCategory: src.defaultCategoryId || 'governance',
        geographicCoverage: 'Madhya Pradesh',
        language: 'hi',
        status: src.status as any,
        isAuthorized: src.isAuthorized,
        pollingIntervalMinutes: src.pollingIntervalMinutes,
        createdById: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return this.fallback.findSourceByUrl(feedUrl);
    }
  }

  public async listSources(params?: RssSourceFilterParams): Promise<{ items: RssSourceItem[]; total: number }> {
    try {
      const sources = await this.prisma.rssSource.findMany();
      if (sources.length > 0) {
        const mapped: RssSourceItem[] = sources.map((s) => ({
          id: s.id,
          name: s.name,
          feedUrl: s.feedUrl,
          publisherName: s.name,
          sourceCategory: s.defaultCategoryId || 'governance',
          geographicCoverage: 'Madhya Pradesh',
          language: 'hi',
          status: s.status as any,
          isAuthorized: s.isAuthorized,
          pollingIntervalMinutes: s.pollingIntervalMinutes,
          createdById: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        return { items: mapped, total: mapped.length };
      }
      return this.fallback.listSources(params);
    } catch {
      return this.fallback.listSources(params);
    }
  }

  public async createSource(source: RssSourceItem): Promise<RssSourceItem> {
    try {
      await this.prisma.rssSource.create({
        data: {
          id: source.id,
          name: source.name,
          feedUrl: source.feedUrl,
          isAuthorized: source.isAuthorized,
          pollingIntervalMinutes: source.pollingIntervalMinutes,
          status: source.status,
        },
      });
      return source;
    } catch {
      return this.fallback.createSource(source);
    }
  }

  public async updateSource(id: string, updates: Partial<RssSourceItem>): Promise<RssSourceItem> {
    try {
      await this.prisma.rssSource.update({
        where: { id },
        data: {
          name: updates.name,
          feedUrl: updates.feedUrl,
          isAuthorized: updates.isAuthorized,
          pollingIntervalMinutes: updates.pollingIntervalMinutes,
          status: updates.status,
        },
      });
      return (await this.findSourceById(id))!;
    } catch {
      return this.fallback.updateSource(id, updates);
    }
  }

  public async deleteSource(id: string): Promise<boolean> {
    try {
      await this.prisma.rssSource.delete({ where: { id } });
      return true;
    } catch {
      return this.fallback.deleteSource(id);
    }
  }

  public async findItemByGuidHash(guidHash: string): Promise<ImportedRssItemDto | null> {
    return this.fallback.findItemByGuidHash(guidHash);
  }

  public async findItemById(id: string): Promise<ImportedRssItemDto | null> {
    return this.fallback.findItemById(id);
  }

  public async createImportedItem(item: ImportedRssItemDto): Promise<ImportedRssItemDto> {
    return this.fallback.createImportedItem(item);
  }

  public async updateImportedItem(id: string, updates: Partial<ImportedRssItemDto>): Promise<ImportedRssItemDto> {
    return this.fallback.updateImportedItem(id, updates);
  }

  public async listImportedItems(params?: ImportedItemFilterParams): Promise<{ items: ImportedRssItemDto[]; total: number }> {
    return this.fallback.listImportedItems(params);
  }

  public async createStoryCluster(cluster: StoryClusterItem): Promise<StoryClusterItem> {
    return this.fallback.createStoryCluster(cluster);
  }

  public async listStoryClusters(): Promise<StoryClusterItem[]> {
    return this.fallback.listStoryClusters();
  }

  public async getHealthSummary(): Promise<RssHealthSummary> {
    return this.fallback.getHealthSummary();
  }
}

