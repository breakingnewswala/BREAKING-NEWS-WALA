/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Video Timeline Engine (VID-003, VID-006)
 * 
 * Strict Invariant: Pure timeline management, scene manipulation,
 * timing validation, and multi-track calculation logic decoupled from React UI.
 */

import { VideoAspectRatio, VideoProject, VideoScene, VideoTransition } from '../types';

export interface TimelineValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const VIDEO_ASPECT_RATIO_SPECS: Record<
  VideoAspectRatio,
  { width: number; height: number; labelHi: string; labelEn: string; icon: string }
> = {
  '9:16': {
    width: 1080,
    height: 1920,
    labelHi: '9:16 वर्टिकल (रील्स / शॉर्ट्स)',
    labelEn: '9:16 Vertical (Reels / Shorts)',
    icon: '📱',
  },
  '16:9': {
    width: 1920,
    height: 1080,
    labelHi: '16:9 लैंडस्केप (यूट्यूब / वेब)',
    labelEn: '16:9 Landscape (YouTube / Web)',
    icon: '🖥️',
  },
  '1:1': {
    width: 1080,
    height: 1080,
    labelHi: '1:1 स्क्वायर (व्हाट्सएप / फ़ीड)',
    labelEn: '1:1 Square (WhatsApp / Feed)',
    icon: '⏹️',
  },
  '4:5': {
    width: 1080,
    height: 1350,
    labelHi: '4:5 पोर्ट्रेट (इंस्टाग्राम फ़ीड)',
    labelEn: '4:5 Portrait (Instagram Feed)',
    icon: '📱',
  },
  '3:4': {
    width: 1080,
    height: 1440,
    labelHi: '3:4 पोर्ट्रेट वीडियो',
    labelEn: '3:4 Portrait Video',
    icon: '📄',
  },
};

export const VIDEO_CONSTRAINTS = {
  MIN_SCENE_DURATION_SEC: 1,
  MAX_SCENE_DURATION_SEC: 60,
  MIN_PROJECT_DURATION_SEC: 3,
  MAX_PROJECT_DURATION_SEC: 600, // 10 minutes
  MAX_SCENES: 25,
  DEFAULT_FPS: 30,
} as const;

export class VideoTimelineEngine {
  /**
   * Resolves pixel width & height for a target aspect ratio.
   */
  public static getDimensions(aspectRatio: VideoAspectRatio): { width: number; height: number } {
    const spec = VIDEO_ASPECT_RATIO_SPECS[aspectRatio] || VIDEO_ASPECT_RATIO_SPECS['9:16'];
    return { width: spec.width, height: spec.height };
  }

  /**
   * Calculates total project duration from scenes.
   */
  public static calculateTotalDuration(scenes: VideoScene[]): number {
    return scenes.reduce((total, scn) => total + (scn.durationSec || 5), 0);
  }

  /**
   * Computes start and end timestamps for each scene sequentially.
   */
  public static computeSceneTimeRanges(scenes: VideoScene[]): Array<{
    scene: VideoScene;
    startSec: number;
    endSec: number;
  }> {
    let currentStart = 0;
    return scenes.map((scene, idx) => {
      const dur = scene.durationSec || 5;
      const range = {
        scene: { ...scene, order: idx },
        startSec: currentStart,
        endSec: currentStart + dur,
      };
      currentStart += dur;
      return range;
    });
  }

  /**
   * Identifies active scene index for a given playhead timestamp in seconds.
   */
  public static getSceneIndexAtTime(scenes: VideoScene[], timeSec: number): number {
    if (scenes.length === 0) return -1;
    let accumulated = 0;
    for (let i = 0; i < scenes.length; i++) {
      const nextAccum = accumulated + (scenes[i].durationSec || 5);
      if (timeSec >= accumulated && timeSec < nextAccum) {
        return i;
      }
      accumulated = nextAccum;
    }
    return scenes.length - 1;
  }

  /**
   * Formats seconds into human-readable timecode (MM:SS or MM:SS.ms).
   */
  public static formatTimecode(seconds: number, includeMs = false): string {
    const totalSec = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');

    if (!includeMs) {
      return `${pad(mins)}:${pad(secs)}`;
    }
    const ms = Math.floor((seconds - totalSec) * 10);
    return `${pad(mins)}:${pad(secs)}.${ms}`;
  }

  /**
   * Moves a scene from one position to another in the sequence.
   */
  public static moveScene(scenes: VideoScene[], fromIndex: number, toIndex: number): VideoScene[] {
    if (
      fromIndex < 0 ||
      fromIndex >= scenes.length ||
      toIndex < 0 ||
      toIndex >= scenes.length ||
      fromIndex === toIndex
    ) {
      return [...scenes];
    }
    const copy = [...scenes];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    return copy.map((scn, idx) => ({ ...scn, order: idx }));
  }

  /**
   * Duplicates an existing scene directly adjacent to it.
   */
  public static duplicateScene(scenes: VideoScene[], sceneId: string): VideoScene[] {
    const idx = scenes.findIndex((s) => s.id === sceneId);
    if (idx === -1) return [...scenes];
    const original = scenes[idx];
    const clone: VideoScene = {
      ...original,
      id: `scn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${original.title} (प्रतिलिपि)`,
      order: idx + 1,
    };
    const copy = [...scenes];
    copy.splice(idx + 1, 0, clone);
    return copy.map((scn, i) => ({ ...scn, order: i }));
  }

  /**
   * Removes a scene from the sequence.
   */
  public static removeScene(scenes: VideoScene[], sceneId: string): VideoScene[] {
    if (scenes.length <= 1) return scenes; // Keep at least one scene
    const filtered = scenes.filter((s) => s.id !== sceneId);
    return filtered.map((scn, i) => ({ ...scn, order: i }));
  }

  /**
   * Validates a video project against constraints.
   */
  public static validateProject(project: Partial<VideoProject>): TimelineValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!project.title || project.title.trim().length === 0) {
      errors.push('वीडियो प्रोजेक्ट का शीर्षक अनिवार्य है।');
    }

    if (!project.scenes || project.scenes.length === 0) {
      errors.push('प्रोजेक्ट में कम से कम एक दृश्य (Scene) होना अनिवार्य है।');
    } else {
      if (project.scenes.length > VIDEO_CONSTRAINTS.MAX_SCENES) {
        errors.push(`दृश्यों की अधिकतम संख्या ${VIDEO_CONSTRAINTS.MAX_SCENES} से अधिक नहीं हो सकती।`);
      }

      const totalDur = this.calculateTotalDuration(project.scenes);
      if (totalDur < VIDEO_CONSTRAINTS.MIN_PROJECT_DURATION_SEC) {
        errors.push(`वीडियो की न्यूनतम अवधि ${VIDEO_CONSTRAINTS.MIN_PROJECT_DURATION_SEC} सेकंड होनी चाहिए।`);
      }
      if (totalDur > VIDEO_CONSTRAINTS.MAX_PROJECT_DURATION_SEC) {
        errors.push(`वीडियो की अधिकतम अवधि ${VIDEO_CONSTRAINTS.MAX_PROJECT_DURATION_SEC} सेकंड (10 मिनट) से अधिक नहीं हो सकती।`);
      }

      project.scenes.forEach((s, idx) => {
        if (!s.headline || s.headline.trim().length === 0) {
          warnings.push(`दृश्य #${idx + 1} ("${s.title}") में शीर्षक रिक्त है।`);
        }
        if (s.durationSec < VIDEO_CONSTRAINTS.MIN_SCENE_DURATION_SEC) {
          errors.push(`दृश्य #${idx + 1} की अवधि न्यूनतम ${VIDEO_CONSTRAINTS.MIN_SCENE_DURATION_SEC} सेकंड होनी चाहिए।`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Helper to get total duration of project in seconds.
   */
  public static getTotalDuration(project: Partial<VideoProject>): number {
    return this.calculateTotalDuration(project.scenes || []);
  }

  /**
   * Creates a default starting VideoProject.
   */
  public static createDefaultProject(overrides?: Partial<VideoProject>): VideoProject {
    const aspectRatio: VideoAspectRatio = overrides?.aspectRatio || '9:16';
    const dims = this.getDimensions(aspectRatio);

    const defaultScenes: VideoScene[] = [
      {
        id: `scn-${Date.now()}-1`,
        title: 'दृश्य 1: ब्रेकिंग अलर्ट',
        order: 0,
        durationSec: 4,
        backgroundStyle: 'gradient-red',
        headline: overrides?.title || 'ब्रेकिंग न्यूज़: बड़ी खबर',
        subtext: 'घटनास्थल से ताज़ा अपडेट्स और ग्राउंड रिपोर्ट।',
        district: overrides?.districtName || 'मध्य प्रदेश',
        category: 'BREAKING',
        showLogo: true,
        showTicker: true,
        transition: 'cut',
        kenBurnsEffect: true,
      },
    ];

    return {
      id: overrides?.id || `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: overrides?.title || 'नया वीडियो प्रोजेक्ट',
      aspectRatio,
      resolution: overrides?.resolution || '720p',
      width: dims.width,
      height: dims.height,
      fps: overrides?.fps || 30,
      totalDurationSec: this.calculateTotalDuration(overrides?.scenes || defaultScenes),
      scenes: overrides?.scenes || defaultScenes,
      audioTracks: overrides?.audioTracks || [],
      status: overrides?.status || 'DRAFT',
      version: overrides?.version || 1,
      districtName: overrides?.districtName || 'मध्य प्रदेश',
      createdBy: overrides?.createdBy || 'usr-desk',
      createdByName: overrides?.createdByName || 'संपादकीय डेस्क',
      createdByRole: overrides?.createdByRole || 'EDITOR',
      createdAt: overrides?.createdAt || new Date().toISOString(),
      updatedAt: overrides?.updatedAt || new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Instantiates a new project from a master VideoTemplate.
   */
  public static instantiateFromTemplate(
    template: any,
    overrides?: Partial<VideoProject>
  ): VideoProject {
    const dims = this.getDimensions(template.aspectRatio || '9:16');
    const scenes: VideoScene[] = (template.scenes || []).map((s: any, idx: number) => ({
      ...s,
      id: `scn-${Date.now()}-${idx + 1}`,
      order: idx,
      durationSec: s.durationSec || s.durationSeconds || 4,
    }));

    return {
      id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${template.title} प्रोजेक्ट`,
      description: template.description,
      aspectRatio: template.aspectRatio || '9:16',
      resolution: template.recommendedResolution || '720p',
      width: dims.width,
      height: dims.height,
      fps: 30,
      totalDurationSec: this.calculateTotalDuration(scenes),
      scenes,
      audioTracks: [],
      templateId: template.id,
      templateTitle: template.title,
      status: 'DRAFT',
      version: 1,
      createdBy: overrides?.createdBy || 'usr-desk',
      createdByName: overrides?.createdByName || 'संपादकीय डेस्क',
      createdByRole: overrides?.createdByRole || 'EDITOR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }
}
