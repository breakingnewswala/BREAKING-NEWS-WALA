/**
 * BREAKING NEWS WALA — Design & Graphics Studio Module Types
 * Re-exports and expands shared design types for the backend engine.
 */

import type {
  DesignStudioType,
  DesignAspectRatio,
  DesignElementType,
  DesignElement,
  CanvasDimensions,
  CanvasBackground,
  DesignDocument,
  DesignTemplate,
  BrandAssetProfile,
  ExportDesignPayload,
  ExportDesignResult,
} from '@bnw/types';

export type {
  DesignStudioType,
  DesignAspectRatio,
  DesignElementType,
  DesignElement,
  CanvasDimensions,
  CanvasBackground,
  DesignDocument,
  DesignTemplate,
  BrandAssetProfile,
  ExportDesignPayload,
  ExportDesignResult,
};

export interface CreateDesignDto {
  title: string;
  description?: string;
  studioType: DesignStudioType;
  dimensions: CanvasDimensions;
  background?: CanvasBackground;
  elements?: DesignElement[];
  templateId?: string;
  associatedArticleId?: string;
}

export interface UpdateDesignDto {
  title?: string;
  description?: string;
  dimensions?: CanvasDimensions;
  background?: CanvasBackground;
  elements?: DesignElement[];
  status?: 'draft' | 'published' | 'archived';
  version?: number;
}

export interface CreateTemplateDto {
  name: string;
  description: string;
  category: string;
  studioType: DesignStudioType;
  dimensions: CanvasDimensions;
  previewUrl?: string;
  schema: DesignDocument;
  categoryRestrictionId?: string | null;
  isActive?: boolean;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  category?: string;
  studioType?: DesignStudioType;
  dimensions?: CanvasDimensions;
  previewUrl?: string;
  schema?: DesignDocument;
  categoryRestrictionId?: string | null;
  isActive?: boolean;
}

export interface DesignFilterParams {
  ownerId?: string;
  studioType?: DesignStudioType;
  status?: 'draft' | 'published' | 'archived';
  page?: number;
  limit?: number;
  search?: string;
}

export interface TemplateFilterParams {
  category?: string;
  studioType?: DesignStudioType;
  isActive?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface AiDesignConceptRequest {
  topic: string;
  studioType: DesignStudioType;
  category?: string;
  district?: string;
  keyPoints?: string[];
  articleId?: string;
}

export interface AiDesignConceptResponse {
  conceptId: string;
  headlineSuggestionHi: string;
  standfirstHi: string;
  suggestedPreset: string;
  recommendedPalette: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
  recommendedElements: Array<{
    type: 'badge' | 'text' | 'image' | 'shape';
    label: string;
    purpose: string;
  }>;
  aiAttribution: {
    agentId: string;
    isAiAssisted: true;
    symbolicNotice: string;
  };
}
