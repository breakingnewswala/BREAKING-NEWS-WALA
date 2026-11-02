/**
 * BREAKING NEWS WALA — Video Production Studio & FFmpeg Pipeline Types
 * Grounded in docs/11-Architecture.md, docs/12-Database.md (DOM-I),
 * and docs/DECISIONS.md (DEC-048, DEC-060)
 */

import {
  VideoAspectRatio,
  VideoResolution,
  VideoTrackType,
  VideoClipType,
  VideoClip,
  VideoTrack,
  VideoSubtitleCue,
  VideoSubtitleTrack,
  VideoProjectDocument,
  VideoTemplate,
  VideoRenderStatus,
  VideoRenderJob,
} from '@bnw/types';

export type {
  VideoAspectRatio,
  VideoResolution,
  VideoTrackType,
  VideoClipType,
  VideoClip,
  VideoTrack,
  VideoSubtitleCue,
  VideoSubtitleTrack,
  VideoProjectDocument,
  VideoTemplate,
  VideoRenderStatus,
  VideoRenderJob,
};

export interface CreateVideoProjectDto {
  title: string;
  description?: string;
  aspectRatio?: VideoAspectRatio;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  tracks?: VideoTrack[];
  subtitles?: VideoSubtitleTrack;
  introPresetId?: string;
  outroPresetId?: string;
  templateId?: string;
  associatedNewsId?: string;
  brandProfileId?: string;
}

export interface UpdateVideoProjectDto {
  title?: string;
  description?: string;
  aspectRatio?: VideoAspectRatio;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  tracks?: VideoTrack[];
  subtitles?: VideoSubtitleTrack;
  introPresetId?: string;
  outroPresetId?: string;
  templateId?: string;
  associatedNewsId?: string;
  brandProfileId?: string;
  status?: 'draft' | 'ready_to_render' | 'rendering' | 'completed' | 'failed';
}

export interface SubmitRenderJobDto {
  projectId: string;
  resolution?: VideoResolution;
  fps?: number;
  quality?: 'standard' | 'high';
}

export interface VideoProjectFilterParams {
  creatorId?: string;
  status?: string;
  aspectRatio?: VideoAspectRatio;
  search?: string;
  page?: number;
  limit?: number;
}

export interface VideoTemplateFilterParams {
  category?: string;
  aspectRatio?: VideoAspectRatio;
  search?: string;
  isActive?: boolean;
}

export interface RenderJobFilterParams {
  projectId?: string;
  status?: VideoRenderStatus;
  limit?: number;
  offset?: number;
}

export interface PrefillFromArticleDto {
  articleId: string;
  aspectRatio?: VideoAspectRatio;
  templateId?: string;
  includeIntroBumper?: boolean;
  includeOutroBumper?: boolean;
  includeSubtitles?: boolean;
  targetDurationSeconds?: number;
}

export interface AiVideoScriptRequest {
  articleId?: string;
  headline?: string;
  contentSnippet?: string;
  category?: string;
  district?: string;
  targetDurationSeconds?: number;
  tone?: 'breaking' | 'analytical' | 'ground_report' | 'bulletin';
  language?: 'hi' | 'en';
}

export interface AiVideoScene {
  sceneNumber: number;
  durationSeconds: number;
  shotType: 'opening_flash' | 'reporter_standup' | 'b_roll_footage' | 'quote_graphic' | 'outro_sting';
  visualDescriptionHi: string;
  voiceoverNarrationHi: string;
  lowerThirdText?: {
    headlineHi: string;
    sublineHi: string;
  };
}

export interface AiVideoScriptResponse {
  headlineHi: string;
  totalEstimatedDuration: number;
  scenes: AiVideoScene[];
  suggestedSubtitleCues: VideoSubtitleCue[];
  suggestedBumper: string;
  musicMood: 'urgent_breaking' | 'dramatic_crime' | 'neutral_explainer' | 'inspirational';
}

export interface AiVideoLowerThirdsRequest {
  topic: string;
  speakerName?: string;
  speakerDesignation?: string;
  location?: string;
  aspectRatio?: VideoAspectRatio;
}

export interface AiVideoLowerThirdsResponse {
  headlineHi: string;
  sublineHi: string;
  locationBadgeHi: string;
  recommendedDurationSec: number;
}
