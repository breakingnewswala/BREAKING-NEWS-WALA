/**
 * BREAKING NEWS WALA — Design & Graphics Studio Service
 * Grounded in docs/07-Design.md, docs/05-Workflows.md (WF-RGFX-01, WF-AGFX-01),
 * and docs/DECISIONS.md (DEC-048, DEC-057, DEC-060)
 */

import {
  IDesignRepository,
  InMemoryDesignRepository,
  PrismaDesignRepository,
} from './design.repository';
import {
  CreateDesignDto,
  UpdateDesignDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  DesignFilterParams,
  TemplateFilterParams,
  ExportDesignPayload,
  ExportDesignResult,
  AiDesignConceptRequest,
  AiDesignConceptResponse,
  DesignDocument,
  DesignTemplate,
  BrandAssetProfile,
  CanvasDimensions,
} from './types';
import { DesignEngine } from './design.engine';
import { ExportEngine } from './export.engine';
import {
  CANONICAL_BRAND_ASSET,
  PRESET_YOUTUBE_THUMBNAIL,
  PRESET_INSTAGRAM_PORTRAIT,
} from './constants';
import { AppError } from '../../errors/app-error';
import { randomUUID } from 'crypto';

export class DesignService {
  private repository: IDesignRepository;

  constructor(repository?: IDesignRepository) {
    if (repository) {
      this.repository = repository;
    } else {
      this.repository =
        process.env.NODE_ENV === 'test'
          ? new InMemoryDesignRepository()
          : new PrismaDesignRepository();
    }
  }

  /**
   * Enforces DEC-048 invariant across all design endpoints.
   */
  private assertNotChiefEditor(roles: string[] = []): void {
    if (roles.includes('ROLE_CHIEF_EDITOR') || roles.includes('chief_editor')) {
      throw AppError.forbidden(
        'DEC-048: ROLE_CHIEF_EDITOR is currently Pending Approval and cannot perform design operations.'
      );
    }
  }

  /**
   * Enforces admin/editor privileges for template management.
   */
  private assertAdminOrEditor(roles: string[] = []): void {
    this.assertNotChiefEditor(roles);
    const hasElevated = roles.some((r) =>
      ['admin', 'super_admin', 'editor', 'desk_editor', 'sub_editor'].includes(r.toLowerCase())
    );
    if (!hasElevated) {
      throw AppError.forbidden('केवल अधिकृत संपादक या व्यवस्थापक ही टेम्पलेट प्रबंधन कर सकते हैं।');
    }
  }

  /**
   * Creates a new design document.
   */
  public async createDesign(
    dto: CreateDesignDto,
    user: { id: string; roles: string[] }
  ): Promise<DesignDocument> {
    this.assertNotChiefEditor(user.roles);

    const doc: DesignDocument = {
      id: randomUUID(),
      title: dto.title.trim(),
      description: dto.description?.trim(),
      studioType: dto.studioType,
      dimensions: dto.dimensions,
      background: dto.background || { type: 'color', value: '#111827' },
      elements: dto.elements || [],
      templateId: dto.templateId,
      associatedArticleId: dto.associatedArticleId,
      brandProfileId: CANONICAL_BRAND_ASSET.id,
      version: 1,
      status: 'draft',
      ownerId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validation = DesignEngine.validateDesignDocument(doc);
    if (!validation.isValid) {
      throw AppError.validationFailed(validation.errors.join(' '));
    }

    const brandValidation = DesignEngine.validateBrandIntegrity(doc);
    if (!brandValidation.isCompliant) {
      throw AppError.badRequest(brandValidation.violations.join(' '));
    }

    return this.repository.createDesign(doc);
  }

  /**
   * Retrieves a design document by ID.
   */
  public async getDesign(id: string, user: { id: string; roles: string[] }): Promise<DesignDocument> {
    this.assertNotChiefEditor(user.roles);

    const doc = await this.repository.getDesignById(id);
    if (!doc) {
      throw AppError.notFound(`डिज़ाइन आईडी "${id}" नहीं मिली।`);
    }

    // Role check: Owner, Editor, or Admin
    const isElevated = user.roles.some((r) =>
      ['admin', 'super_admin', 'editor', 'desk_editor'].includes(r.toLowerCase())
    );
    if (doc.ownerId !== user.id && !isElevated) {
      throw AppError.forbidden('आपको इस डिज़ाइन को देखने की अनुमति नहीं है।');
    }

    return doc;
  }

  /**
   * Updates an existing design document.
   */
  public async updateDesign(
    id: string,
    dto: UpdateDesignDto,
    user: { id: string; roles: string[] }
  ): Promise<DesignDocument> {
    this.assertNotChiefEditor(user.roles);

    const existing = await this.getDesign(id, user);

    // Merge updates
    const merged: DesignDocument = {
      ...existing,
      title: dto.title !== undefined ? dto.title.trim() : existing.title,
      description: dto.description !== undefined ? dto.description.trim() : existing.description,
      dimensions: dto.dimensions || existing.dimensions,
      background: dto.background || existing.background,
      elements: dto.elements || existing.elements,
      status: dto.status || existing.status,
    };

    const validation = DesignEngine.validateDesignDocument(merged);
    if (!validation.isValid) {
      throw AppError.validationFailed(validation.errors.join(' '));
    }

    const brandValidation = DesignEngine.validateBrandIntegrity(merged);
    if (!brandValidation.isCompliant) {
      throw AppError.badRequest(brandValidation.violations.join(' '));
    }

    return this.repository.updateDesign(id, merged);
  }

  /**
   * Duplicates an existing design.
   */
  public async duplicateDesign(
    id: string,
    user: { id: string; roles: string[] },
    newTitle?: string
  ): Promise<DesignDocument> {
    this.assertNotChiefEditor(user.roles);
    await this.getDesign(id, user); // checks access
    return this.repository.duplicateDesign(id, user.id, newTitle);
  }

  /**
   * Deletes a design document.
   */
  public async deleteDesign(id: string, user: { id: string; roles: string[] }): Promise<boolean> {
    this.assertNotChiefEditor(user.roles);
    const existing = await this.getDesign(id, user);

    const isElevated = user.roles.some((r) =>
      ['admin', 'super_admin', 'editor'].includes(r.toLowerCase())
    );
    if (existing.ownerId !== user.id && !isElevated) {
      throw AppError.forbidden('केवल डिज़ाइन का निर्माता अथवा व्यवस्थापक ही इसे हटा सकते हैं।');
    }

    return this.repository.deleteDesign(id, user.id);
  }

  /**
   * Lists designs with pagination and filters.
   */
  public async listDesigns(
    params: DesignFilterParams,
    user: { id: string; roles: string[] }
  ): Promise<{ designs: DesignDocument[]; total: number }> {
    this.assertNotChiefEditor(user.roles);

    const isElevated = user.roles.some((r) =>
      ['admin', 'super_admin', 'editor'].includes(r.toLowerCase())
    );

    // If not elevated, restrict to user's own designs
    const effectiveParams: DesignFilterParams = isElevated
      ? params
      : { ...params, ownerId: user.id };

    return this.repository.listDesigns(effectiveParams);
  }

  /**
   * Creates a new master design template.
   */
  public async createTemplate(
    dto: CreateTemplateDto,
    user: { id: string; roles: string[] }
  ): Promise<DesignTemplate> {
    this.assertAdminOrEditor(user.roles);

    const tpl: DesignTemplate = {
      id: randomUUID(),
      name: dto.name.trim(),
      description: dto.description.trim(),
      category: dto.category,
      studioType: dto.studioType,
      dimensions: dto.dimensions,
      previewUrl: dto.previewUrl,
      schema: dto.schema,
      categoryRestrictionId: dto.categoryRestrictionId || null,
      isActive: dto.isActive ?? true,
      version: 1,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.repository.createTemplate(tpl);
  }

  /**
   * Retrieves a template by ID.
   */
  public async getTemplate(id: string, user: { id: string; roles: string[] }): Promise<DesignTemplate> {
    this.assertNotChiefEditor(user.roles);

    const tpl = await this.repository.getTemplateById(id);
    if (!tpl) {
      throw AppError.notFound(`टेम्पलेट आईडी "${id}" नहीं मिला।`);
    }

    return tpl;
  }

  /**
   * Updates an existing template.
   */
  public async updateTemplate(
    id: string,
    dto: UpdateTemplateDto,
    user: { id: string; roles: string[] }
  ): Promise<DesignTemplate> {
    this.assertAdminOrEditor(user.roles);
    const existing = await this.getTemplate(id, user);

    const merged: Partial<DesignTemplate> = {
      name: dto.name !== undefined ? dto.name.trim() : existing.name,
      description: dto.description !== undefined ? dto.description.trim() : existing.description,
      category: dto.category || existing.category,
      studioType: dto.studioType || existing.studioType,
      dimensions: dto.dimensions || existing.dimensions,
      previewUrl: dto.previewUrl || existing.previewUrl,
      schema: dto.schema || existing.schema,
      categoryRestrictionId:
        dto.categoryRestrictionId !== undefined ? dto.categoryRestrictionId : existing.categoryRestrictionId,
      isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
    };

    return this.repository.updateTemplate(id, merged);
  }

  /**
   * Archives a template (deactivates).
   */
  public async archiveTemplate(id: string, user: { id: string; roles: string[] }): Promise<DesignTemplate> {
    this.assertAdminOrEditor(user.roles);
    return this.repository.archiveTemplate(id);
  }

  /**
   * Publishes / Activates a template.
   */
  public async publishTemplate(id: string, user: { id: string; roles: string[] }): Promise<DesignTemplate> {
    this.assertAdminOrEditor(user.roles);
    return this.repository.publishTemplate(id);
  }

  /**
   * Lists templates with filters.
   */
  public async listTemplates(
    params: TemplateFilterParams,
    user: { id: string; roles: string[] }
  ): Promise<{ templates: DesignTemplate[]; total: number }> {
    this.assertNotChiefEditor(user.roles);

    const isElevated = user.roles.some((r) =>
      ['admin', 'super_admin', 'editor'].includes(r.toLowerCase())
    );

    // If standard reporter, force active templates only
    const effectiveParams: TemplateFilterParams = isElevated
      ? params
      : { ...params, isActive: true };

    return this.repository.listTemplates(effectiveParams);
  }

  /**
   * Retrieves official brand profile assets.
   */
  public async getBrandProfile(user: { id: string; roles: string[] }): Promise<BrandAssetProfile> {
    this.assertNotChiefEditor(user.roles);
    return this.repository.getBrandProfile();
  }

  /**
   * Renders and exports a design document to high-resolution format.
   */
  public async exportDesign(
    payload: ExportDesignPayload,
    user: { id: string; roles: string[] }
  ): Promise<ExportDesignResult> {
    this.assertNotChiefEditor(user.roles);
    let doc: DesignDocument;
    if (payload.document) {
      doc = payload.document;
    } else if (payload.designId) {
      doc = await this.getDesign(payload.designId, user);
    } else {
      throw AppError.badRequest('Either designId or document must be provided for export.');
    }

    return ExportEngine.exportDesign(
      doc,
      payload.format,
      payload.scaleFactor || 1,
      payload.quality || 0.92
    );
  }

  /**
   * Generates AI-assisted design concept and layout suggestions (AGT-GRP-008).
   */
  public async generateAiConcept(
    req: AiDesignConceptRequest,
    user: { id: string; roles: string[] }
  ): Promise<AiDesignConceptResponse> {
    this.assertNotChiefEditor(user.roles);

    const isBreaking = req.topic.toLowerCase().includes('breaking') || req.category === 'breaking';

    return {
      conceptId: `concept_${randomUUID()}`,
      headlineSuggestionHi: isBreaking
        ? `[ब्रेकिंग] ${req.topic}: प्रमुख अपडेट एवं विस्तृत विवरण`
        : `${req.topic}: विशेष ग्राउंड रिपोर्ट`,
      standfirstHi: `${req.district || 'मध्यप्रदेश'}: मुख्य बिंदुओं पर त्वरित नजर व प्राथमिक जानकारी।`,
      suggestedPreset:
        req.studioType === 'thumbnail'
          ? 'YOUTUBE_THUMBNAIL (16:9)'
          : req.studioType === 'social'
            ? 'INSTAGRAM_PORTRAIT (4:5)'
            : 'YOUTUBE_THUMBNAIL (16:9)',
      recommendedPalette: {
        primary: isBreaking ? CANONICAL_BRAND_ASSET.primaryRed : CANONICAL_BRAND_ASSET.primaryYellow,
        accent: CANONICAL_BRAND_ASSET.primaryBlue,
        background: '#111827',
        text: '#FFFFFF',
      },
      recommendedElements: [
        { type: 'badge', label: isBreaking ? 'BREAKING NEWS' : 'विशेष रिपोर्ट', purpose: 'ध्यान आकर्षित करने हेतु' },
        { type: 'text', label: 'बोल्ड मुख्य शीर्षक', purpose: 'स्पष्ट पठनीयता 48px Noto Sans Devanagari' },
        { type: 'image', label: 'प्रासंगिक ग्राउंड फ़ोटो', purpose: 'उच्च-रिज़ॉल्यूशन 16:9 अथवा 4:5 फ़ोटो' },
        { type: 'shape', label: 'डार्क ग्रेडिएंट ओवरले', purpose: 'शीर्षक के पीछे उच्च कंट्रास्ट हेतु' },
      ],
      aiAttribution: {
        agentId: 'AGT-GRP-008',
        isAiAssisted: true,
        symbolicNotice:
          'यह सुझाव AI ग्राफिक्स असिस्टेंट (AGT-GRP-008) द्वारा उत्पन्न किया गया है। वास्तविक समाचार प्रकाशन से पूर्व संपादकीय समीक्षा अनिवार्य है।',
      },
    };
  }

  /**
   * Initializes a design document prefilled from article metadata.
   */
  public async prefillFromArticle(
    articleData: {
      id: string;
      title: string;
      summary?: string;
      primaryCategoryNameHi?: string;
      primaryLocationNameHi?: string;
      featuredMediaUrl?: string;
    },
    studioType: 'graphic' | 'thumbnail' | 'social',
    user: { id: string; roles: string[] }
  ): Promise<DesignDocument> {
    this.assertNotChiefEditor(user.roles);

    const preset: CanvasDimensions =
      studioType === 'thumbnail'
        ? PRESET_YOUTUBE_THUMBNAIL
        : studioType === 'social'
          ? PRESET_INSTAGRAM_PORTRAIT
          : PRESET_YOUTUBE_THUMBNAIL;

    const elements: any[] = [];

    // Background / Photo if available
    if (articleData.featuredMediaUrl) {
      elements.push({
        id: 'el-article-photo',
        type: 'image',
        name: 'आलेख छायाचित्र',
        x: 0,
        y: 0,
        width: preset.width,
        height: preset.height,
        rotation: 0,
        opacity: 0.8,
        zIndex: 1,
        isLocked: false,
        isVisible: true,
        imageUrl: articleData.featuredMediaUrl,
        objectFit: 'cover',
      });
    }

    // Gradient Overlay for contrast
    elements.push({
      id: 'el-contrast-overlay',
      type: 'shape',
      name: 'कंट्रास्ट ओवरले',
      x: 0,
      y: Math.round(preset.height * 0.45),
      width: preset.width,
      height: Math.round(preset.height * 0.55),
      rotation: 0,
      opacity: 0.95,
      zIndex: 2,
      isLocked: true,
      isVisible: true,
      shapeKind: 'rectangle',
      fillColor: '#111827',
    });

    // Category / Location Badge
    const badgeText = articleData.primaryLocationNameHi
      ? `${articleData.primaryLocationNameHi} ग्राउंड रिपोर्ट`
      : articleData.primaryCategoryNameHi || 'ताज़ा ख़बर';

    elements.push({
      id: 'el-meta-badge',
      type: 'badge',
      name: 'श्रेणी बैज',
      x: 60,
      y: Math.round(preset.height * 0.5),
      width: 220,
      height: 44,
      rotation: 0,
      opacity: 1,
      zIndex: 3,
      isLocked: false,
      isVisible: true,
      badgeKind: 'location',
      text: badgeText,
      primaryColor: CANONICAL_BRAND_ASSET.primaryRed,
      textColor: '#FFFFFF',
    });

    // Headline Text
    elements.push({
      id: 'el-headline-text',
      type: 'text',
      name: 'आलेख शीर्षक',
      x: 60,
      y: Math.round(preset.height * 0.58),
      width: preset.width - 120,
      height: 180,
      rotation: 0,
      opacity: 1,
      zIndex: 4,
      isLocked: false,
      isVisible: true,
      text: articleData.title,
      fontFamily: 'Rozha One',
      fontSize: 44,
      fontWeight: 800,
      lineHeight: 1.35,
      letterSpacing: 0,
      textAlign: 'left',
      color: '#FFFFFF',
    });

    // Official Channel Logo
    elements.push({
      id: 'el-brand-logo',
      type: 'logo',
      name: 'आधिकारिक लोगो',
      x: preset.width - 220,
      y: 40,
      width: 180,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: 5,
      isLocked: true,
      isVisible: true,
      variant: 'official_primary',
      imageUrl: CANONICAL_BRAND_ASSET.logoUrl,
      keepAspectRatio: true,
    });

    return this.createDesign(
      {
        title: `${articleData.title.slice(0, 40)} - स्टूडियो डिज़ाइन`,
        studioType,
        dimensions: preset,
        background: { type: 'color', value: '#111827' },
        elements,
        associatedArticleId: articleData.id,
      },
      user
    );
  }
}
