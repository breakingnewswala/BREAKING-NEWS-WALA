/**
 * BREAKING NEWS WALA — Timeline Engine
 * Multi-track timeline management, clip manipulation, validation,
 * and subtitle synchronization engine.
 * Grounded in docs/11-Architecture.md and docs/12-Database.md (DOM-I)
 */

import {
  VideoClip,
  VideoClipType,
  VideoSubtitleCue,
  VideoProjectDocument,
} from './types';
import { VIDEO_CONSTRAINTS } from './constants';
import { AppError } from '../../errors/app-error';
import { randomUUID } from 'crypto';

export interface TimelineValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function getClipStart(c: VideoClip): number {
  return c.timelineStart ?? c.startTime ?? 0;
}

export function getClipDuration(c: VideoClip): number {
  return c.timelineDuration ?? c.duration ?? 0;
}

export function getClipSourceStart(c: VideoClip): number {
  return c.sourceStart ?? (c as any).trimIn ?? 0;
}

export function getClipSourceEnd(c: VideoClip): number {
  return c.sourceEnd ?? (c as any).trimOut ?? getClipDuration(c);
}

export class TimelineEngine {
  /**
   * Validates a complete VideoProjectDocument against editorial and operational constraints.
   */
  public static validate(project: VideoProjectDocument): TimelineValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!project.title || project.title.trim().length === 0) {
      errors.push('वीडियो प्रोजेक्ट का शीर्षक (Title) अनिवार्य है।');
    }

    if (project.width <= 0 || project.height <= 0) {
      errors.push('वीडियो की चौड़ाई (width) और ऊंचाई (height) शून्य से अधिक होनी चाहिए।');
    }

    if (!VIDEO_CONSTRAINTS.ALLOWED_FPS.includes(project.fps as 24 | 25 | 30 | 60)) {
      warnings.push(`एफपीएस ${project.fps} गैर-मानक है, अनुशंसित मान 30 या 60 है।`);
    }

    if (!project.tracks || !Array.isArray(project.tracks)) {
      errors.push('प्रोजेक्ट में ट्रैक्स (Tracks) की सूची अनिवार्य है।');
      return { valid: false, errors, warnings };
    }

    if (project.tracks.length > VIDEO_CONSTRAINTS.MAX_TRACKS) {
      errors.push(
        `अधिकतम ट्रैक्स की सीमा ${VIDEO_CONSTRAINTS.MAX_TRACKS} है (वर्तमान: ${project.tracks.length})।`
      );
    }

    let totalClipCount = 0;
    let computedMaxDuration = 0;

    for (const track of project.tracks) {
      if (!track.id || !track.type) {
        errors.push('प्रत्येक ट्रैक में id और type अनिवार्य है।');
        continue;
      }

      if (track.clips.length > VIDEO_CONSTRAINTS.MAX_CLIPS_PER_TRACK) {
        errors.push(
          `ट्रैक "${track.name}" में अधिकतम ${VIDEO_CONSTRAINTS.MAX_CLIPS_PER_TRACK} क्लिप्स हो सकते हैं।`
        );
      }

      totalClipCount += track.clips.length;

      // Validate clips in track
      for (let i = 0; i < track.clips.length; i++) {
        const clip = track.clips[i];
        if (!clip) continue;

        const start = getClipStart(clip);
        const dur = getClipDuration(clip);
        const trimIn = getClipSourceStart(clip);
        const trimOut = getClipSourceEnd(clip);
        const clipName = clip.name || clip.id;

        if (start < 0) {
          errors.push(`क्लिप "${clipName}" का startTime शून्य से कम नहीं हो सकता।`);
        }
        if (dur <= 0) {
          errors.push(`क्लिप "${clipName}" की अवधि (duration) शून्य से अधिक होनी चाहिए।`);
        }
        if (trimIn < 0) {
          errors.push(`क्लिप "${clipName}" का trimIn शून्य या अधिक होना चाहिए।`);
        }
        if (trimOut <= trimIn) {
          errors.push(`क्लिप "${clipName}" का trimOut उसके trimIn से बड़ा होना चाहिए।`);
        }

        const clipEndTime = start + dur;
        if (clipEndTime > computedMaxDuration) {
          computedMaxDuration = clipEndTime;
        }

        // Check for chronological overlap on same video track
        if (track.type === 'video' && i > 0) {
          const prevClip = track.clips[i - 1];
          if (prevClip) {
            const prevEnd = getClipStart(prevClip) + getClipDuration(prevClip);
            if (start < prevEnd - 0.01) {
              warnings.push(
                `ट्रैक "${track.name}" में क्लिप "${prevClip.name || prevClip.id}" और "${clipName}" परस्पर ओवरलैप कर रहे हैं।`
              );
            }
          }
        }
      }
    }

    if (totalClipCount > VIDEO_CONSTRAINTS.MAX_TOTAL_CLIPS) {
      errors.push(
        `कुल क्लिप्स की सीमा ${VIDEO_CONSTRAINTS.MAX_TOTAL_CLIPS} से अधिक है (वर्तमान: ${totalClipCount})।`
      );
    }

    if (computedMaxDuration > VIDEO_CONSTRAINTS.MAX_DURATION_SEC) {
      errors.push(
        `वीडियो की कुल अवधि ${VIDEO_CONSTRAINTS.MAX_DURATION_SEC} सेकंड (10 मिनट) से अधिक नहीं हो सकती (गणना: ${computedMaxDuration.toFixed(1)}s)।`
      );
    }

    // Validate Subtitles
    if (project.subtitles && project.subtitles.cues) {
      if (project.subtitles.cues.length > VIDEO_CONSTRAINTS.MAX_SUBTITLE_CUES) {
        errors.push(
          `अधिकतम सबटाइटल पंक्तियों की सीमा ${VIDEO_CONSTRAINTS.MAX_SUBTITLE_CUES} है।`
        );
      }

      for (const cue of project.subtitles.cues) {
        if (cue.startTime < 0) {
          errors.push(`सबटाइटल cue का startTime 0 से कम नहीं हो सकता।`);
        }
        if (cue.endTime <= cue.startTime) {
          errors.push(`सबटाइटल cue का endTime startTime से अधिक होना चाहिए।`);
        }
        if (!cue.text || cue.text.trim().length === 0) {
          warnings.push(`सबटाइटल cue "${cue.id}" में टेक्स्ट रिक्त है।`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Recalculates total duration of the project based on max clip end time.
   */
  public static calculateTotalDuration(project: VideoProjectDocument): number {
    let maxEndTime = 0;
    for (const track of project.tracks) {
      for (const clip of track.clips) {
        const endTime = getClipStart(clip) + getClipDuration(clip);
        if (endTime > maxEndTime) {
          maxEndTime = endTime;
        }
      }
    }
    if (project.subtitles && project.subtitles.cues) {
      for (const cue of project.subtitles.cues) {
        if (cue.endTime > maxEndTime) {
          maxEndTime = cue.endTime;
        }
      }
    }
    return Math.max(1, Math.round(maxEndTime * 100) / 100);
  }

  /**
   * Adds a clip to a specific track.
   */
  public static addClip(
    project: VideoProjectDocument,
    trackId: string,
    clipInput: Partial<VideoClip> & { name?: string; type?: string }
  ): VideoProjectDocument {
    const track = project.tracks.find((t) => t.id === trackId);
    if (!track) {
      throw AppError.notFound(`ट्रैक ID "${trackId}" नहीं मिला।`);
    }

    const start = clipInput.timelineStart ?? clipInput.startTime ?? 0;
    const dur = clipInput.timelineDuration ?? clipInput.duration ?? 5;
    const trimIn = clipInput.sourceStart ?? (clipInput as any).trimIn ?? 0;
    const trimOut = clipInput.sourceEnd ?? (clipInput as any).trimOut ?? dur;

    const newClip: VideoClip = {
      id: clipInput.id || `clip-${randomUUID()}`,
      trackId,
      name: clipInput.name || 'क्लिप',
      clipType: (clipInput.clipType || clipInput.type || 'video') as VideoClipType,
      timelineStart: start,
      timelineDuration: dur,
      startTime: start,
      duration: dur,
      sourceStart: trimIn,
      sourceEnd: trimOut,
      mediaAssetId: clipInput.mediaAssetId,
      mediaUrl: clipInput.mediaUrl,
      volume: clipInput.volume ?? 1.0,
      opacity: clipInput.opacity ?? 1.0,
      x: clipInput.x ?? 0,
      y: clipInput.y ?? 0,
      scale: clipInput.scale ?? 1,
      properties: clipInput.properties || {},
    };

    const updatedClips = [...track.clips, newClip].sort(
      (a, b) => getClipStart(a) - getClipStart(b)
    );
    const updatedTracks = project.tracks.map((t) =>
      t.id === trackId ? { ...t, clips: updatedClips } : t
    );

    const updatedProject: VideoProjectDocument = {
      ...project,
      tracks: updatedTracks,
      version: project.version + 1,
      updatedAt: new Date().toISOString(),
    };

    updatedProject.duration = TimelineEngine.calculateTotalDuration(updatedProject);
    return updatedProject;
  }

  /**
   * Removes a clip from a specific track.
   */
  public static removeClip(
    project: VideoProjectDocument,
    trackId: string,
    clipId: string
  ): VideoProjectDocument {
    const track = project.tracks.find((t) => t.id === trackId);
    if (!track) {
      throw AppError.notFound(`ट्रैक ID "${trackId}" नहीं मिला।`);
    }

    const clipExists = track.clips.some((c) => c.id === clipId);
    if (!clipExists) {
      throw AppError.notFound(`क्लिप ID "${clipId}" ट्रैक "${trackId}" में नहीं मिली।`);
    }

    const updatedClips = track.clips.filter((c) => c.id !== clipId);
    const updatedTracks = project.tracks.map((t) =>
      t.id === trackId ? { ...t, clips: updatedClips } : t
    );

    const updatedProject: VideoProjectDocument = {
      ...project,
      tracks: updatedTracks,
      version: project.version + 1,
      updatedAt: new Date().toISOString(),
    };

    updatedProject.duration = TimelineEngine.calculateTotalDuration(updatedProject);
    return updatedProject;
  }

  /**
   * Trims in/out points of a clip and updates duration accordingly.
   */
  public static trimClip(
    project: VideoProjectDocument,
    trackId: string,
    clipId: string,
    trimIn: number,
    trimOut: number
  ): VideoProjectDocument {
    if (trimIn < 0 || trimOut <= trimIn) {
      throw AppError.badRequest('अमान्य ट्रिम बिंदु: trimOut > trimIn >= 0 होना आवश्यक है।');
    }

    const track = project.tracks.find((t) => t.id === trackId);
    if (!track) {
      throw AppError.notFound(`ट्रैक ID "${trackId}" नहीं मिला।`);
    }

    const clipIndex = track.clips.findIndex((c) => c.id === clipId);
    if (clipIndex === -1) {
      throw AppError.notFound(`क्लिप ID "${clipId}" नहीं मिली।`);
    }

    const originalClip = track.clips[clipIndex];
    if (!originalClip) {
      throw AppError.notFound(`क्लिप ID "${clipId}" नहीं मिली।`);
    }

    const newDuration = Math.round((trimOut - trimIn) * 100) / 100;

    const updatedClip: VideoClip = {
      ...originalClip,
      sourceStart: trimIn,
      sourceEnd: trimOut,
      timelineDuration: newDuration,
      duration: newDuration,
    };

    const updatedClips = [...track.clips];
    updatedClips[clipIndex] = updatedClip;

    const updatedTracks = project.tracks.map((t) =>
      t.id === trackId ? { ...t, clips: updatedClips } : t
    );

    const updatedProject: VideoProjectDocument = {
      ...project,
      tracks: updatedTracks,
      version: project.version + 1,
      updatedAt: new Date().toISOString(),
    };

    updatedProject.duration = TimelineEngine.calculateTotalDuration(updatedProject);
    return updatedProject;
  }

  /**
   * Splits a clip at a specific timeline timestamp into two sequential clips.
   */
  public static splitClip(
    project: VideoProjectDocument,
    trackId: string,
    clipId: string,
    splitTimeSec: number
  ): VideoProjectDocument {
    const track = project.tracks.find((t) => t.id === trackId);
    if (!track) {
      throw AppError.notFound(`ट्रैक ID "${trackId}" नहीं मिला।`);
    }

    const clip = track.clips.find((c) => c.id === clipId);
    if (!clip) {
      throw AppError.notFound(`क्लिप ID "${clipId}" नहीं मिली।`);
    }

    const clipStart = getClipStart(clip);
    const clipDur = getClipDuration(clip);
    const clipEnd = clipStart + clipDur;

    if (splitTimeSec <= clipStart + 0.1 || splitTimeSec >= clipEnd - 0.1) {
      throw AppError.badRequest(
        `विभाजन समय (${splitTimeSec}s) क्लिप की सीमा [${clipStart}s, ${clipEnd}s] के भीतर होना आवश्यक है।`
      );
    }

    const splitOffset = splitTimeSec - clipStart;
    const firstPartDuration = Math.round(splitOffset * 100) / 100;
    const secondPartDuration = Math.round((clipDur - splitOffset) * 100) / 100;
    const sourceStart = getClipSourceStart(clip);
    const sourceEnd = getClipSourceEnd(clip);

    const firstClip: VideoClip = {
      ...clip,
      id: `${clip.id}-part1`,
      name: `${clip.name || 'क्लिप'} (भाग 1)`,
      timelineDuration: firstPartDuration,
      duration: firstPartDuration,
      sourceEnd: sourceStart + firstPartDuration,
    };

    const secondClip: VideoClip = {
      ...clip,
      id: `${clip.id}-part2`,
      name: `${clip.name || 'क्लिप'} (भाग 2)`,
      timelineStart: splitTimeSec,
      startTime: splitTimeSec,
      timelineDuration: secondPartDuration,
      duration: secondPartDuration,
      sourceStart: sourceStart + firstPartDuration,
      sourceEnd: sourceEnd,
    };

    const updatedClips = track.clips
      .flatMap((c) => (c.id === clipId ? [firstClip, secondClip] : [c]))
      .sort((a, b) => getClipStart(a) - getClipStart(b));

    const updatedTracks = project.tracks.map((t) =>
      t.id === trackId ? { ...t, clips: updatedClips } : t
    );

    const updatedProject: VideoProjectDocument = {
      ...project,
      tracks: updatedTracks,
      version: project.version + 1,
      updatedAt: new Date().toISOString(),
    };

    updatedProject.duration = TimelineEngine.calculateTotalDuration(updatedProject);
    return updatedProject;
  }

  /**
   * Exports subtitle cues to SubRip (.srt) format.
   */
  public static exportToSrt(cues: VideoSubtitleCue[]): string {
    const formatTime = (sec: number): string => {
      const hours = Math.floor(sec / 3600);
      const minutes = Math.floor((sec % 3600) / 60);
      const seconds = Math.floor(sec % 60);
      const millis = Math.floor((sec % 1) * 1000);

      const pad = (num: number, size = 2) => String(num).padStart(size, '0');
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
    };

    const sortedCues = [...cues].sort((a, b) => a.startTime - b.startTime);
    return sortedCues
      .map((cue, index) => {
        return `${index + 1}\n${formatTime(cue.startTime)} --> ${formatTime(cue.endTime)}\n${cue.text}\n`;
      })
      .join('\n');
  }

  /**
   * Exports subtitle cues to WebVTT (.vtt) format.
   */
  public static exportToVtt(cues: VideoSubtitleCue[]): string {
    const formatTime = (sec: number): string => {
      const hours = Math.floor(sec / 3600);
      const minutes = Math.floor((sec % 3600) / 60);
      const seconds = Math.floor(sec % 60);
      const millis = Math.floor((sec % 1) * 1000);

      const pad = (num: number, size = 2) => String(num).padStart(size, '0');
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`;
    };

    const sortedCues = [...cues].sort((a, b) => a.startTime - b.startTime);
    let vtt = 'WEBVTT - BREAKING NEWS WALA\n\n';
    vtt += sortedCues
      .map((cue, index) => {
        return `${index + 1}\n${formatTime(cue.startTime)} --> ${formatTime(cue.endTime)}\n${cue.text}\n`;
      })
      .join('\n');
    return vtt;
  }

  /**
   * Parses SubRip (.srt) text content into structured VideoSubtitleCue items.
   */
  public static parseSrt(srtContent: string): VideoSubtitleCue[] {
    const parseTime = (timeStr: string): number => {
      const normalized = timeStr.trim().replace(',', '.');
      const parts = normalized.split(':');
      if (parts.length < 3) return 0;
      const hours = parseFloat(parts[0] || '0') || 0;
      const minutes = parseFloat(parts[1] || '0') || 0;
      const seconds = parseFloat(parts[2] || '0') || 0;
      return hours * 3600 + minutes * 60 + seconds;
    };

    const blocks = srtContent.replace(/\r\n/g, '\n').split('\n\n');
    const cues: VideoSubtitleCue[] = [];

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 2) continue;

      let timeLineIndex = 0;
      if (/^\d+$/.test(lines[0]?.trim() || '')) {
        timeLineIndex = 1;
      }

      const timeLine = lines[timeLineIndex];
      if (!timeLine || !timeLine.includes('-->')) continue;

      const [startStr, endStr] = timeLine.split('-->');
      const startTime = parseTime(startStr || '0');
      const endTime = parseTime(endStr || '0');
      const text = lines.slice(timeLineIndex + 1).join(' ').trim();

      if (text.length > 0 && endTime > startTime) {
        cues.push({
          id: `cue-${randomUUID()}`,
          startTime: Math.round(startTime * 100) / 100,
          endTime: Math.round(endTime * 100) / 100,
          text,
        });
      }
    }

    return cues;
  }

  /**
   * Generates subtitle cues from text using average speaking rate.
   * Region-appropriate speed: ~130 words per minute in Hindi.
   */
  public static generateSubtitlesFromText(
    fullText: string,
    wordsPerMinute = 130
  ): VideoSubtitleCue[] {
    const sentences = fullText
      .split(/(?<=[।!?\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const cues: VideoSubtitleCue[] = [];
    let currentTime = 0;

    for (const sentence of sentences) {
      const wordCount = sentence.split(/\s+/).length;
      const rawDuration = (wordCount / wordsPerMinute) * 60;
      const duration = Math.min(6.0, Math.max(2.0, Math.round(rawDuration * 10) / 10));

      cues.push({
        id: `cue-${randomUUID()}`,
        startTime: Math.round(currentTime * 100) / 100,
        endTime: Math.round((currentTime + duration) * 100) / 100,
        text: sentence,
      });

      currentTime += duration + 0.2;
    }

    return cues;
  }
}
