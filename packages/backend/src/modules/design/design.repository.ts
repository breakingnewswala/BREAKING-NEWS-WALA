/**
 * BREAKING NEWS WALA — Design & Template Repository Layer
 * Grounded in docs/12-Database.md (DOM-H: Graphics Studio)
 */

import {
  DesignDocument,
  DesignTemplate,
  BrandAssetProfile,
  DesignFilterParams,
  TemplateFilterParams,
} from './types';
import { CANONICAL_TEMPLATES } from './template.seed';
import { CANONICAL_BRAND_ASSET } from './constants';
import { getPrismaClient } from '../../db/client';
import { randomUUID } from 'crypto';

export interface IDesignRepository {
  createDesign(design: DesignDocument): Promise<DesignDocument>;
  getDesignById(id: string): Promise<DesignDocument | null>;
  updateDesign(id: string, updates: Partial<DesignDocument>): Promise<DesignDocument>;
  duplicateDesign(id: string, ownerId: string, newTitle?: string): Promise<DesignDocument>;
  deleteDesign(id: string, ownerId: string): Promise<boolean>;
  listDesigns(params: DesignFilterParams): Promise<{ designs: DesignDocument[]; total: number }>;
  createTemplate(template: DesignTemplate): Promise<DesignTemplate>;
  getTemplateById(id: string): Promise<DesignTemplate | null>;
  updateTemplate(id: string, updates: Partial<DesignTemplate>): Promise<DesignTemplate>;
  listTemplates(params: TemplateFilterParams): Promise<{ templates: DesignTemplate[]; total: number }>;
  archiveTemplate(id: string): Promise<DesignTemplate>;
  publishTemplate(id: string): Promise<DesignTemplate>;
  getBrandProfile(): Promise<BrandAssetProfile>;
}

export class InMemoryDesignRepository implements IDesignRepository {
  private designs: Map<string, DesignDocument> = new Map();
  private templates: Map<string, DesignTemplate> = new Map();
  private brandProfile: BrandAssetProfile = { ...CANONICAL_BRAND_ASSET };

  constructor() {
    // Seed canonical templates
    for (const tpl of CANONICAL_TEMPLATES) {
      this.templates.set(tpl.id, JSON.parse(JSON.stringify(tpl)));
    }
  }

  public async createDesign(design: DesignDocument): Promise<DesignDocument> {
    const record: DesignDocument = {
      ...design,
      id: design.id || randomUUID(),
      createdAt: design.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.designs.set(record.id, JSON.parse(JSON.stringify(record)));
    return JSON.parse(JSON.stringify(record));
  }

  public async getDesignById(id: string): Promise<DesignDocument | null> {
    const item = this.designs.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async updateDesign(id: string, updates: Partial<DesignDocument>): Promise<DesignDocument> {
    const existing = this.designs.get(id);
    if (!existing) {
      throw new Error(`Design with ID "${id}" not found.`);
    }

    const updated: DesignDocument = {
      ...existing,
      ...updates,
      id: existing.id,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };

    this.designs.set(id, JSON.parse(JSON.stringify(updated)));
    return JSON.parse(JSON.stringify(updated));
  }

  public async duplicateDesign(id: string, ownerId: string, newTitle?: string): Promise<DesignDocument> {
    const existing = this.designs.get(id);
    if (!existing) {
      throw new Error(`Design with ID "${id}" not found for duplication.`);
    }

    const newId = randomUUID();
    const duplicated: DesignDocument = {
      ...JSON.parse(JSON.stringify(existing)),
      id: newId,
      title: newTitle || `${existing.title} (प्रतिलिपि)`,
      ownerId,
      version: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.designs.set(newId, JSON.parse(JSON.stringify(duplicated)));
    return JSON.parse(JSON.stringify(duplicated));
  }

  public async deleteDesign(id: string, _ownerId: string): Promise<boolean> {
    const existing = this.designs.get(id);
    if (!existing) {
      return false;
    }
    this.designs.delete(id);
    return true;
  }

  public async listDesigns(params: DesignFilterParams): Promise<{ designs: DesignDocument[]; total: number }> {
    let all = Array.from(this.designs.values());

    if (params.ownerId) {
      all = all.filter((d) => d.ownerId === params.ownerId);
    }
    if (params.studioType) {
      all = all.filter((d) => d.studioType === params.studioType);
    }
    if (params.status) {
      all = all.filter((d) => d.status === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter((d) => d.title.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q)));
    }

    // Sort newest first
    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = all.length;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const designs = all.slice(startIndex, startIndex + limit);

    return {
      designs: JSON.parse(JSON.stringify(designs)),
      total,
    };
  }

  public async createTemplate(template: DesignTemplate): Promise<DesignTemplate> {
    const record: DesignTemplate = {
      ...template,
      id: template.id || randomUUID(),
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.set(record.id, JSON.parse(JSON.stringify(record)));
    return JSON.parse(JSON.stringify(record));
  }

  public async getTemplateById(id: string): Promise<DesignTemplate | null> {
    const tpl = this.templates.get(id);
    return tpl ? JSON.parse(JSON.stringify(tpl)) : null;
  }

  public async updateTemplate(id: string, updates: Partial<DesignTemplate>): Promise<DesignTemplate> {
    const existing = this.templates.get(id);
    if (!existing) {
      throw new Error(`Template with ID "${id}" not found.`);
    }

    const updated: DesignTemplate = {
      ...existing,
      ...updates,
      id: existing.id,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(id, JSON.parse(JSON.stringify(updated)));
    return JSON.parse(JSON.stringify(updated));
  }

  public async listTemplates(params: TemplateFilterParams): Promise<{ templates: DesignTemplate[]; total: number }> {
    let all = Array.from(this.templates.values());

    if (params.category) {
      all = all.filter((t) => t.category === params.category);
    }
    if (params.studioType) {
      all = all.filter((t) => t.studioType === params.studioType);
    }
    if (params.isActive !== undefined) {
      all = all.filter((t) => t.isActive === params.isActive);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = all.length;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const templates = all.slice(startIndex, startIndex + limit);

    return {
      templates: JSON.parse(JSON.stringify(templates)),
      total,
    };
  }

  public async archiveTemplate(id: string): Promise<DesignTemplate> {
    return this.updateTemplate(id, { isActive: false });
  }

  public async publishTemplate(id: string): Promise<DesignTemplate> {
    return this.updateTemplate(id, { isActive: true });
  }

  public async getBrandProfile(): Promise<BrandAssetProfile> {
    return JSON.parse(JSON.stringify(this.brandProfile));
  }
}

export class PrismaDesignRepository implements IDesignRepository {
  private fallbackMemory = new InMemoryDesignRepository();

  private get prisma() {
    return getPrismaClient();
  }

  public async createDesign(design: DesignDocument): Promise<DesignDocument> {
    try {
      const templateId = design.templateId || '00000000-0000-0000-0000-000000000001';
      const created = await this.prisma.generatedGraphic.create({
        data: {
          id: design.id || randomUUID(),
          templateId,
          creatorId: design.ownerId,
          associatedNewsId: design.associatedArticleId || null,
          rawInputText: JSON.stringify(design),
          renderStatus: design.status === 'published' ? 'completed' : 'draft',
        },
      });

      return {
        ...design,
        id: created.id,
        createdAt: created.createdAt.toISOString(),
      };
    } catch {
      return this.fallbackMemory.createDesign(design);
    }
  }

  public async getDesignById(id: string): Promise<DesignDocument | null> {
    try {
      const found = await this.prisma.generatedGraphic.findUnique({
        where: { id },
      });
      if (found && found.rawInputText) {
        try {
          return JSON.parse(found.rawInputText) as DesignDocument;
        } catch {
          // parse error
        }
      }
      return this.fallbackMemory.getDesignById(id);
    } catch {
      return this.fallbackMemory.getDesignById(id);
    }
  }

  public async updateDesign(id: string, updates: Partial<DesignDocument>): Promise<DesignDocument> {
    try {
      const existing = await this.getDesignById(id);
      if (!existing) {
        return this.fallbackMemory.updateDesign(id, updates);
      }
      const merged: DesignDocument = {
        ...existing,
        ...updates,
        id,
        version: existing.version + 1,
        updatedAt: new Date().toISOString(),
      };

      await this.prisma.generatedGraphic.update({
        where: { id },
        data: {
          rawInputText: JSON.stringify(merged),
          renderStatus: merged.status === 'published' ? 'completed' : 'draft',
        },
      });

      return merged;
    } catch {
      return this.fallbackMemory.updateDesign(id, updates);
    }
  }

  public async duplicateDesign(id: string, ownerId: string, newTitle?: string): Promise<DesignDocument> {
    return this.fallbackMemory.duplicateDesign(id, ownerId, newTitle);
  }

  public async deleteDesign(id: string, ownerId: string): Promise<boolean> {
    try {
      await this.prisma.generatedGraphic.delete({ where: { id } });
      return true;
    } catch {
      return this.fallbackMemory.deleteDesign(id, ownerId);
    }
  }

  public async listDesigns(params: DesignFilterParams): Promise<{ designs: DesignDocument[]; total: number }> {
    return this.fallbackMemory.listDesigns(params);
  }

  public async createTemplate(template: DesignTemplate): Promise<DesignTemplate> {
    try {
      const created = await this.prisma.graphicTemplate.create({
        data: {
          id: template.id || randomUUID(),
          name: template.name,
          aspectRatio: template.dimensions.aspectRatio,
          templateSchemaJson: template.schema as any,
          categoryRestrictionId: template.categoryRestrictionId || null,
          isActive: template.isActive ?? true,
        },
      });

      return {
        ...template,
        id: created.id,
      };
    } catch {
      return this.fallbackMemory.createTemplate(template);
    }
  }

  public async getTemplateById(id: string): Promise<DesignTemplate | null> {
    try {
      const found = await this.prisma.graphicTemplate.findUnique({ where: { id } });
      if (found) {
        return {
          id: found.id,
          name: found.name,
          description: found.name,
          category: 'breaking',
          studioType: 'graphic',
          dimensions: { width: 1280, height: 720, aspectRatio: found.aspectRatio as any, label: found.name },
          schema: found.templateSchemaJson as any,
          isActive: found.isActive,
          version: 1,
          createdBy: 'system_admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return this.fallbackMemory.getTemplateById(id);
    } catch {
      return this.fallbackMemory.getTemplateById(id);
    }
  }

  public async updateTemplate(id: string, updates: Partial<DesignTemplate>): Promise<DesignTemplate> {
    return this.fallbackMemory.updateTemplate(id, updates);
  }

  public async listTemplates(params: TemplateFilterParams): Promise<{ templates: DesignTemplate[]; total: number }> {
    return this.fallbackMemory.listTemplates(params);
  }

  public async archiveTemplate(id: string): Promise<DesignTemplate> {
    return this.fallbackMemory.archiveTemplate(id);
  }

  public async publishTemplate(id: string): Promise<DesignTemplate> {
    return this.fallbackMemory.publishTemplate(id);
  }

  public async getBrandProfile(): Promise<BrandAssetProfile> {
    return this.fallbackMemory.getBrandProfile();
  }
}
