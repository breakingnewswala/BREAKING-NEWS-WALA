/**
 * BREAKING NEWS WALA — E-Paper Domain Service
 * Enforces editorial state machine, PDF validation, public access gating, and DEC-048 role governance.
 */

import { AppError } from '../../errors/app-error';
import { ArticleWorkflowEngine } from '../articles/article.workflow';
import { getEpaperRepository, IEpaperRepository } from './epaper.repository';
import { ALLOWED_STATUS_TRANSITIONS, EPAPER_LIMITS } from './epaper.constants';
import { validatePdfSignature } from './epaper.validator';
import {
  EpaperEditionItem,
  EpaperPageItem,
  CreateEpaperEditionDto,
  UpdateEpaperEditionDto,
  EpaperArchiveFilter,
  EpaperEditionStatus,
} from './types';

export class EpaperService {
  private customRepo?: IEpaperRepository;

  constructor(repo?: IEpaperRepository) {
    this.customRepo = repo;
  }

  private get repo(): IEpaperRepository {
    return this.customRepo || getEpaperRepository();
  }

  private assertNotChiefEditor(userRoles: string[]): void {
    if (userRoles.some((r) => r.toUpperCase().includes('CHIEF_EDITOR'))) {
      throw AppError.forbidden('ROLE_CHIEF_EDITOR remains Pending Approval under DEC-048.');
    }
  }

  private isElevated(userRoles: string[]): boolean {
    this.assertNotChiefEditor(userRoles);
    return (
      ArticleWorkflowEngine.isElevatedEditor(userRoles) ||
      userRoles.some((r) => {
        const clean = r.toUpperCase().replace(/^ROLE_/, '');
        return clean === 'ADMIN' || clean === 'SUPER_ADMIN';
      })
    );
  }

  // ==========================================
  // PUBLIC READER METHODS
  // ==========================================

  public async getPublicEditions(
    filter: EpaperArchiveFilter
  ): Promise<{ editions: EpaperEditionItem[]; total: number }> {
    return this.repo.findPublishedEditions(filter);
  }

  public async getLatestPublicEdition(districtId?: string): Promise<EpaperEditionItem | null> {
    const result = await this.repo.findPublishedEditions({
      districtId,
      page: 1,
      limit: 1,
    });
    return result.editions[0] || null;
  }

  public async getPublicEditionById(id: string): Promise<EpaperEditionItem> {
    const edition = await this.repo.findById(id);
    if (!edition || edition.status !== 'PUBLISHED' || !edition.isPublic) {
      throw AppError.notFound('E-Paper edition not found or not published.');
    }
    return edition;
  }

  public async recordView(id: string): Promise<void> {
    const edition = await this.repo.findById(id);
    if (!edition || edition.status !== 'PUBLISHED' || !edition.isPublic) {
      throw AppError.notFound('E-Paper edition not found or not published.');
    }
    await this.repo.incrementViewCount(id);
  }

  public async recordDownload(id: string): Promise<void> {
    const edition = await this.repo.findById(id);
    if (!edition || edition.status !== 'PUBLISHED' || !edition.isPublic) {
      throw AppError.notFound('E-Paper edition not found or not published.');
    }
    await this.repo.incrementDownloadCount(id);
  }

  // ==========================================
  // EDITORIAL & ADMIN METHODS
  // ==========================================

  public async getAllEditionsAdmin(
    filter: EpaperArchiveFilter & { status?: EpaperEditionStatus },
    userRoles: string[]
  ): Promise<{ editions: EpaperEditionItem[]; total: number }> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Elevated editorial or administrative role required.');
    }
    return this.repo.findAllEditions(filter);
  }

  public async getEditionByIdAdmin(id: string, userRoles: string[]): Promise<EpaperEditionItem> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Elevated editorial or administrative role required.');
    }
    const edition = await this.repo.findById(id);
    if (!edition) {
      throw AppError.notFound(`E-Paper edition '${id}' not found.`);
    }
    return edition;
  }

  public async createEdition(
    dto: CreateEpaperEditionDto,
    userId: string,
    userRoles: string[]
  ): Promise<EpaperEditionItem> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Elevated editorial or administrative role required.');
    }

    const existing = await this.repo.findByEditionCode(dto.editionCode);
    if (existing) {
      throw AppError.conflict(`Edition code '${dto.editionCode}' already exists.`);
    }

    if (dto.pdfFileSize && dto.pdfFileSize > EPAPER_LIMITS.MAX_PDF_SIZE_BYTES) {
      throw AppError.badRequest(
        `PDF file size exceeds maximum limit of ${EPAPER_LIMITS.MAX_PDF_SIZE_BYTES / (1024 * 1024)} MB.`
      );
    }

    return this.repo.createEdition({
      ...dto,
      createdBy: userId,
      status: 'DRAFT',
    });
  }

  public async updateEdition(
    id: string,
    dto: UpdateEpaperEditionDto,
    userRoles: string[]
  ): Promise<EpaperEditionItem> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Elevated editorial or administrative role required.');
    }

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound(`E-Paper edition '${id}' not found.`);
    }

    if (dto.status && dto.status !== existing.status) {
      this.validateTransition(existing.status, dto.status);
    }

    const updated = await this.repo.updateEdition(id, dto);
    if (!updated) {
      throw AppError.notFound(`E-Paper edition '${id}' not found.`);
    }
    return updated;
  }

  public async transitionStatus(
    id: string,
    targetStatus: EpaperEditionStatus,
    userId: string,
    userRoles: string[]
  ): Promise<EpaperEditionItem> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Elevated editorial or administrative role required.');
    }

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound(`E-Paper edition '${id}' not found.`);
    }

    this.validateTransition(existing.status, targetStatus);

    const updatePayload: Partial<EpaperEditionItem> = {
      status: targetStatus,
    };

    if (targetStatus === 'APPROVED') {
      updatePayload.approvedBy = userId;
    }

    if (targetStatus === 'PUBLISHED') {
      updatePayload.isPublic = true;
      updatePayload.publishedAt = new Date().toISOString();
    }

    if (targetStatus === 'ARCHIVED' || targetStatus === 'RETRACTED') {
      updatePayload.isArchived = true;
      if (targetStatus === 'RETRACTED') {
        updatePayload.isPublic = false;
      }
    }

    const updated = await this.repo.updateEdition(id, updatePayload);
    if (!updated) {
      throw AppError.notFound(`E-Paper edition '${id}' not found.`);
    }
    return updated;
  }

  public async addPage(
    editionId: string,
    page: Omit<EpaperPageItem, 'id' | 'editionId' | 'createdAt'>,
    userRoles: string[]
  ): Promise<EpaperPageItem> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Elevated editorial or administrative role required.');
    }

    const existing = await this.repo.findById(editionId);
    if (!existing) {
      throw AppError.notFound(`E-Paper edition '${editionId}' not found.`);
    }

    if (existing.pageCount >= EPAPER_LIMITS.MAX_PAGE_COUNT) {
      throw AppError.badRequest(
        `Edition has reached maximum allowed page count of ${EPAPER_LIMITS.MAX_PAGE_COUNT}.`
      );
    }

    return this.repo.addPage(editionId, page);
  }

  public async deleteEdition(id: string, userRoles: string[]): Promise<{ success: boolean }> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Elevated editorial or administrative role required.');
    }

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound(`E-Paper edition '${id}' not found.`);
    }

    if (existing.status === 'PUBLISHED') {
      throw AppError.badRequest('Cannot delete a published edition. Retract or archive it first.');
    }

    const deleted = await this.repo.deleteEdition(id);
    return { success: deleted };
  }

  public validatePdfUpload(buffer: Buffer): { valid: boolean; error?: string } {
    if (!buffer || buffer.length === 0) {
      return { valid: false, error: 'Empty file buffer received.' };
    }
    if (buffer.length > EPAPER_LIMITS.MAX_PDF_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size ${buffer.length} bytes exceeds 50MB ceiling (${EPAPER_LIMITS.MAX_PDF_SIZE_BYTES} bytes).`,
      };
    }
    if (!validatePdfSignature(buffer)) {
      return {
        valid: false,
        error: 'Invalid PDF signature. File does not start with %PDF- magic bytes.',
      };
    }
    return { valid: true };
  }

  private validateTransition(current: EpaperEditionStatus, target: EpaperEditionStatus): void {
    if (current === target) return;
    const allowed = ALLOWED_STATUS_TRANSITIONS[current] || [];
    if (!allowed.includes(target)) {
      throw AppError.badRequest(
        `Invalid status transition from '${current}' to '${target}'. Allowed: ${allowed.join(', ') || 'none'}.`
      );
    }
  }
}

let epaperServiceInstance: EpaperService | null = null;

export function getEpaperService(): EpaperService {
  if (!epaperServiceInstance) {
    epaperServiceInstance = new EpaperService();
  }
  return epaperServiceInstance;
}
