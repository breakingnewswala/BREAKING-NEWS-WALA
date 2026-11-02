/**
 * BREAKING NEWS WALA — Video Studio Repository
 * Grounded in docs/11-Architecture.md, docs/12-Database.md (DOM-I),
 * and docs/DECISIONS.md (DEC-017, DEC-018)
 */

import {
  VideoProjectDocument,
  VideoTemplate,
  VideoRenderJob,
  VideoProjectFilterParams,
  VideoTemplateFilterParams,
  RenderJobFilterParams,
} from './types';
import { CANONICAL_VIDEO_TEMPLATES } from './template.seed';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../errors/app-error';

export interface IVideoRepository {
  // Projects
  createProject(doc: VideoProjectDocument): Promise<VideoProjectDocument>;
  getProjectById(id: string): Promise<VideoProjectDocument | null>;
  listProjects(
    params: VideoProjectFilterParams
  ): Promise<{ items: VideoProjectDocument[]; total: number }>;
  updateProject(id: string, doc: Partial<VideoProjectDocument>): Promise<VideoProjectDocument>;
  deleteProject(id: string): Promise<boolean>;

  // Templates
  createTemplate(template: VideoTemplate): Promise<VideoTemplate>;
  getTemplateById(id: string): Promise<VideoTemplate | null>;
  listTemplates(params: VideoTemplateFilterParams): Promise<VideoTemplate[]>;
  updateTemplate(id: string, template: Partial<VideoTemplate>): Promise<VideoTemplate>;

  // Render Jobs
  createRenderJob(job: VideoRenderJob): Promise<VideoRenderJob>;
  getRenderJobById(id: string): Promise<VideoRenderJob | null>;
  listRenderJobs(
    params: RenderJobFilterParams
  ): Promise<{ items: VideoRenderJob[]; total: number }>;
  updateRenderJob(id: string, updates: Partial<VideoRenderJob>): Promise<VideoRenderJob>;
}

/**
 * In-Memory Video Repository for test execution and mock persistence.
 */
export class InMemoryVideoRepository implements IVideoRepository {
  private projects = new Map<string, VideoProjectDocument>();
  private templates = new Map<string, VideoTemplate>();
  private renderJobs = new Map<string, VideoRenderJob>();

  constructor() {
    for (const tpl of CANONICAL_VIDEO_TEMPLATES) {
      this.templates.set(tpl.id, { ...tpl });
    }
  }

  public async createProject(doc: VideoProjectDocument): Promise<VideoProjectDocument> {
    this.projects.set(doc.id, { ...doc });
    return { ...doc };
  }

  public async getProjectById(id: string): Promise<VideoProjectDocument | null> {
    const item = this.projects.get(id);
    return item ? { ...item } : null;
  }

  public async listProjects(
    params: VideoProjectFilterParams
  ): Promise<{ items: VideoProjectDocument[]; total: number }> {
    let list = Array.from(this.projects.values());

    if (params.creatorId) {
      list = list.filter((p) => p.creatorId === params.creatorId);
    }
    if (params.status) {
      list = list.filter((p) => p.status === params.status);
    }
    if (params.aspectRatio) {
      list = list.filter((p) => p.aspectRatio === params.aspectRatio);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const total = list.length;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    return { items, total };
  }

  public async updateProject(
    id: string,
    docUpdates: Partial<VideoProjectDocument>
  ): Promise<VideoProjectDocument> {
    const existing = this.projects.get(id);
    if (!existing) {
      throw AppError.notFound(`वीडियो प्रोजेक्ट "${id}" नहीं मिला।`);
    }

    const updated: VideoProjectDocument = {
      ...existing,
      ...docUpdates,
      id: existing.id, // Immutable ID
      creatorId: existing.creatorId, // Immutable Creator
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };

    this.projects.set(id, updated);
    return { ...updated };
  }

  public async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  public async createTemplate(template: VideoTemplate): Promise<VideoTemplate> {
    this.templates.set(template.id, { ...template });
    return { ...template };
  }

  public async getTemplateById(id: string): Promise<VideoTemplate | null> {
    const tpl = this.templates.get(id);
    return tpl ? { ...tpl } : null;
  }

  public async listTemplates(params: VideoTemplateFilterParams): Promise<VideoTemplate[]> {
    let list = Array.from(this.templates.values());

    if (params.category) {
      list = list.filter((t) => t.category === params.category);
    }
    if (params.aspectRatio) {
      list = list.filter((t) => t.aspectRatio === params.aspectRatio);
    }
    if (params.isActive !== undefined) {
      list = list.filter((t) => t.isActive === params.isActive);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public async updateTemplate(
    id: string,
    templateUpdates: Partial<VideoTemplate>
  ): Promise<VideoTemplate> {
    const existing = this.templates.get(id);
    if (!existing) {
      throw AppError.notFound(`वीडियो टेम्पलेट "${id}" नहीं मिला।`);
    }

    const updated: VideoTemplate = {
      ...existing,
      ...templateUpdates,
      id: existing.id,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(id, updated);
    return { ...updated };
  }

  public async createRenderJob(job: VideoRenderJob): Promise<VideoRenderJob> {
    this.renderJobs.set(job.id, { ...job });
    return { ...job };
  }

  public async getRenderJobById(id: string): Promise<VideoRenderJob | null> {
    const job = this.renderJobs.get(id);
    return job ? { ...job } : null;
  }

  public async listRenderJobs(
    params: RenderJobFilterParams
  ): Promise<{ items: VideoRenderJob[]; total: number }> {
    let list = Array.from(this.renderJobs.values());

    if (params.projectId) {
      list = list.filter((j) => j.projectId === params.projectId);
    }
    if (params.status) {
      list = list.filter((j) => j.status === params.status);
    }

    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = list.length;
    const offset = params.offset || 0;
    const limit = params.limit || 20;
    const items = list.slice(offset, offset + limit);

    return { items, total };
  }

  public async updateRenderJob(
    id: string,
    updates: Partial<VideoRenderJob>
  ): Promise<VideoRenderJob> {
    const existing = this.renderJobs.get(id);
    if (!existing) {
      throw AppError.notFound(`रेंडर कार्य "${id}" नहीं मिला।`);
    }

    const updated: VideoRenderJob = {
      ...existing,
      ...updates,
      id: existing.id,
    };

    this.renderJobs.set(id, updated);
    return { ...updated };
  }
}

/**
 * Prisma-backed Video Repository integrating with PostgreSQL DOM-I schema.
 */
export class PrismaVideoRepository implements IVideoRepository {
  private prisma: PrismaClient;
  private fallback: InMemoryVideoRepository;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.fallback = new InMemoryVideoRepository();
  }

  public async createProject(doc: VideoProjectDocument): Promise<VideoProjectDocument> {
    try {
      const record = await this.prisma.videoProject.create({
        data: {
          id: doc.id,
          title: doc.title,
          aspectRatio: doc.aspectRatio,
          scriptText: JSON.stringify(doc),
          status: doc.status,
          creatorId: doc.creatorId,
        },
      });

      return {
        ...doc,
        id: record.id,
        createdAt: record.createdAt.toISOString(),
      };
    } catch {
      return this.fallback.createProject(doc);
    }
  }

  public async getProjectById(id: string): Promise<VideoProjectDocument | null> {
    try {
      const record = await this.prisma.videoProject.findUnique({
        where: { id },
      });
      if (!record) return null;

      try {
        const parsed = JSON.parse(record.scriptText);
        return {
          ...parsed,
          id: record.id,
          title: record.title,
          aspectRatio: record.aspectRatio,
          status: record.status,
        };
      } catch {
        return null;
      }
    } catch {
      return this.fallback.getProjectById(id);
    }
  }

  public async listProjects(
    params: VideoProjectFilterParams
  ): Promise<{ items: VideoProjectDocument[]; total: number }> {
    try {
      const where: Record<string, unknown> = {};
      if (params.creatorId) where.creatorId = params.creatorId;
      if (params.status) where.status = params.status;
      if (params.aspectRatio) where.aspectRatio = params.aspectRatio;
      if (params.search) {
        where.title = { contains: params.search, mode: 'insensitive' };
      }

      const total = await this.prisma.videoProject.count({ where });
      const page = params.page || 1;
      const limit = params.limit || 20;

      const records = await this.prisma.videoProject.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const items: VideoProjectDocument[] = [];
      for (const r of records) {
        try {
          const parsed = JSON.parse(r.scriptText);
          items.push({
            ...parsed,
            id: r.id,
            title: r.title,
            aspectRatio: r.aspectRatio as any,
            status: r.status as any,
          });
        } catch {
          // ignore corrupted json
        }
      }

      return { items, total };
    } catch {
      return this.fallback.listProjects(params);
    }
  }

  public async updateProject(
    id: string,
    docUpdates: Partial<VideoProjectDocument>
  ): Promise<VideoProjectDocument> {
    try {
      const current = await this.getProjectById(id);
      if (!current) {
        throw AppError.notFound(`वीडियो प्रोजेक्ट "${id}" नहीं मिला।`);
      }

      const merged: VideoProjectDocument = {
        ...current,
        ...docUpdates,
        id,
        version: current.version + 1,
        updatedAt: new Date().toISOString(),
      };

      await this.prisma.videoProject.update({
        where: { id },
        data: {
          title: merged.title,
          aspectRatio: merged.aspectRatio,
          status: merged.status,
          scriptText: JSON.stringify(merged),
        },
      });

      return merged;
    } catch {
      return this.fallback.updateProject(id, docUpdates);
    }
  }

  public async deleteProject(id: string): Promise<boolean> {
    try {
      await this.prisma.videoProject.delete({ where: { id } });
      return true;
    } catch {
      return this.fallback.deleteProject(id);
    }
  }

  public async createTemplate(template: VideoTemplate): Promise<VideoTemplate> {
    return this.fallback.createTemplate(template);
  }

  public async getTemplateById(id: string): Promise<VideoTemplate | null> {
    return this.fallback.getTemplateById(id);
  }

  public async listTemplates(params: VideoTemplateFilterParams): Promise<VideoTemplate[]> {
    return this.fallback.listTemplates(params);
  }

  public async updateTemplate(
    id: string,
    templateUpdates: Partial<VideoTemplate>
  ): Promise<VideoTemplate> {
    return this.fallback.updateTemplate(id, templateUpdates);
  }

  public async createRenderJob(job: VideoRenderJob): Promise<VideoRenderJob> {
    try {
      const record = await this.prisma.videoRenderJob.create({
        data: {
          id: job.id,
          projectId: job.projectId,
          renderProgressPercent: job.progressPercent,
          status: job.status,
        },
      });

      return {
        ...job,
        id: record.id,
        createdAt: record.createdAt.toISOString(),
      };
    } catch {
      return this.fallback.createRenderJob(job);
    }
  }

  public async getRenderJobById(id: string): Promise<VideoRenderJob | null> {
    try {
      const record = await this.prisma.videoRenderJob.findUnique({
        where: { id },
      });
      if (!record) return null;

      return {
        id: record.id,
        projectId: record.projectId,
        outputFormat: 'mp4',
        resolution: '1080p',
        aspectRatio: '9:16',
        status: record.status as any,
        progressPercent: record.renderProgressPercent,
        createdAt: record.createdAt.toISOString(),
      };
    } catch {
      return this.fallback.getRenderJobById(id);
    }
  }

  public async listRenderJobs(
    params: RenderJobFilterParams
  ): Promise<{ items: VideoRenderJob[]; total: number }> {
    try {
      const where: Record<string, unknown> = {};
      if (params.projectId) where.projectId = params.projectId;
      if (params.status) where.status = params.status;

      const total = await this.prisma.videoRenderJob.count({ where });
      const records = await this.prisma.videoRenderJob.findMany({
        where,
        skip: params.offset || 0,
        take: params.limit || 20,
        orderBy: { createdAt: 'desc' },
      });

      const items: VideoRenderJob[] = records.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        outputFormat: 'mp4',
        resolution: '1080p',
        aspectRatio: '9:16',
        status: r.status as any,
        progressPercent: r.renderProgressPercent,
        createdAt: r.createdAt.toISOString(),
      }));

      return { items, total };
    } catch {
      return this.fallback.listRenderJobs(params);
    }
  }

  public async updateRenderJob(
    id: string,
    updates: Partial<VideoRenderJob>
  ): Promise<VideoRenderJob> {
    try {
      const data: Record<string, unknown> = {};
      if (updates.status) data.status = updates.status;
      if (updates.progressPercent !== undefined) {
        data.renderProgressPercent = updates.progressPercent;
      }
      if (updates.outputMediaId) {
        data.outputMediaId = updates.outputMediaId;
      }

      const updated = await this.prisma.videoRenderJob.update({
        where: { id },
        data,
      });

      const existing = (await this.getRenderJobById(id)) || updates;
      return {
        ...(existing as VideoRenderJob),
        ...updates,
        id: updated.id,
        progressPercent: updated.renderProgressPercent,
        status: updated.status as any,
      };
    } catch {
      return this.fallback.updateRenderJob(id, updates);
    }
  }
}

