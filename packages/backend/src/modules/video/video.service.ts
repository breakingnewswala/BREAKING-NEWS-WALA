/**
 * BREAKING NEWS WALA — Video Studio Service
 * Grounded in docs/11-Architecture.md, docs/12-Database.md (DOM-I),
 * docs/17-Agents.md (AGT-VID-009), docs/20-Integrations.md (INT-VID-013),
 * and docs/DECISIONS.md (DEC-048, DEC-060)
 */

import {
  IVideoRepository,
  InMemoryVideoRepository,
  PrismaVideoRepository,
} from './video.repository';
import {
  CreateVideoProjectDto,
  UpdateVideoProjectDto,
  SubmitRenderJobDto,
  VideoProjectFilterParams,
  VideoTemplateFilterParams,
  RenderJobFilterParams,
  PrefillFromArticleDto,
  AiVideoScriptRequest,
  AiVideoScriptResponse,
  AiVideoLowerThirdsRequest,
  AiVideoLowerThirdsResponse,
  VideoProjectDocument,
  VideoTemplate,
  VideoRenderJob,
  VideoClip,
  VideoTrack,
  VideoAspectRatio,
} from './types';
import { TimelineEngine } from './timeline.engine';
import { FfmpegService } from './ffmpeg.service';
import {
  VIDEO_ASPECT_RATIO_PRESETS,
  CANONICAL_VIDEO_BRAND,
  VIDEO_CONSTRAINTS,
  VIDEO_ALLOWED_CODECS,
} from './constants';
import { AppError } from '../../errors/app-error';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as os from 'os';

export class VideoService {
  private repository: IVideoRepository;
  private ffmpegService: FfmpegService;

  constructor(repository?: IVideoRepository, ffmpegService?: FfmpegService) {
    if (repository) {
      this.repository = repository;
    } else {
      this.repository =
        process.env.NODE_ENV === 'test'
          ? new InMemoryVideoRepository()
          : new PrismaVideoRepository();
    }

    this.ffmpegService = ffmpegService || new FfmpegService();
  }

  /**
   * Enforces DEC-048 invariant: ROLE_CHIEF_EDITOR is currently Pending Approval.
   */
  private assertNotChiefEditor(roles: string[] = []): void {
    if (roles.includes('ROLE_CHIEF_EDITOR') || roles.includes('chief_editor')) {
      throw AppError.forbidden(
        'DEC-048: ROLE_CHIEF_EDITOR is currently Pending Approval and cannot perform video operations.'
      );
    }
  }

  // =========================================================================
  // Video Project Operations
  // =========================================================================

  public async createProject(
    dto: CreateVideoProjectDto,
    creatorId: string,
    roles: string[] = []
  ): Promise<VideoProjectDocument> {
    this.assertNotChiefEditor(roles);

    if (!dto.title || dto.title.trim().length === 0) {
      throw AppError.badRequest('वीडियो प्रोजेक्ट का शीर्षक (Title) अनिवार्य है।');
    }

    const aspectRatio: VideoAspectRatio = dto.aspectRatio || '9:16';
    const preset = VIDEO_ASPECT_RATIO_PRESETS[aspectRatio] || VIDEO_ASPECT_RATIO_PRESETS['9:16'];

    const width = dto.width || preset.width;
    const height = dto.height || preset.height;
    const fps = dto.fps || preset.defaultFps;
    const duration = dto.duration || 30;

    const projectId = `vid-${randomUUID()}`;
    const now = new Date().toISOString();

    const defaultTrkV = `trk-${randomUUID()}`;
    const defaultTracks: VideoTrack[] = dto.tracks || [
      {
        id: defaultTrkV,
        name: 'मुख्य वीडियो व विजुअल',
        type: 'video',
        order: 0,
        isLocked: false,
        isVisible: true,
        isMuted: false,
        clips: [
          {
            id: `clp-${randomUUID()}`,
            trackId: defaultTrkV,
            name: 'इंट्रो बंपर',
            clipType: 'intro',
            mediaUrl: CANONICAL_VIDEO_BRAND.introBumperUrl,
            timelineStart: 0,
            timelineDuration: CANONICAL_VIDEO_BRAND.introBumperUrl ? 3 : 0,
            sourceStart: 0,
            sourceEnd: 3,
            volume: 1,
            opacity: 1,
            properties: { isBumper: true },
          },
        ],
      },
      {
        id: `trk-${randomUUID()}`,
        name: 'लोअर थर्ड व ग्राफिक ओवरले',
        type: 'graphics',
        order: 1,
        isLocked: false,
        isVisible: true,
        isMuted: false,
        clips: [],
      },
      {
        id: `trk-${randomUUID()}`,
        name: 'वॉइसओवर व कमेंट्री',
        type: 'voiceover',
        order: 2,
        isLocked: false,
        isVisible: true,
        isMuted: false,
        clips: [],
      },
      {
        id: `trk-${randomUUID()}`,
        name: 'बैकग्राउंड संगीत',
        type: 'audio',
        order: 3,
        isLocked: false,
        isVisible: true,
        isMuted: false,
        clips: [],
      },
    ];

    const projectDoc: VideoProjectDocument = {
      id: projectId,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      aspectRatio,
      width,
      height,
      fps,
      duration,
      tracks: defaultTracks,
      subtitles: dto.subtitles,
      introPresetId: dto.introPresetId,
      outroPresetId: dto.outroPresetId,
      templateId: dto.templateId,
      associatedNewsId: dto.associatedNewsId,
      brandProfileId: dto.brandProfileId || CANONICAL_VIDEO_BRAND.officialLogoHash,
      status: 'draft',
      version: 1,
      creatorId,
      createdAt: now,
      updatedAt: now,
    };

    projectDoc.duration = TimelineEngine.calculateTotalDuration(projectDoc);

    const validation = TimelineEngine.validate(projectDoc);
    if (!validation.valid) {
      throw AppError.badRequest(`प्रोजेक्ट सत्यापन विफल: ${validation.errors.join(', ')}`);
    }

    return this.repository.createProject(projectDoc);
  }

  public async getProjectById(
    id: string,
    roles: string[] = []
  ): Promise<VideoProjectDocument> {
    this.assertNotChiefEditor(roles);
    const project = await this.repository.getProjectById(id);
    if (!project) {
      throw AppError.notFound(`वीडियो प्रोजेक्ट "${id}" नहीं मिला।`);
    }
    return project;
  }

  public async listProjects(
    params: VideoProjectFilterParams,
    roles: string[] = []
  ): Promise<{ items: VideoProjectDocument[]; total: number }> {
    this.assertNotChiefEditor(roles);
    return this.repository.listProjects(params);
  }

  public async updateProject(
    id: string,
    dto: UpdateVideoProjectDto,
    roles: string[] = []
  ): Promise<VideoProjectDocument> {
    this.assertNotChiefEditor(roles);

    const existing = await this.getProjectById(id, roles);

    const merged: VideoProjectDocument = {
      ...existing,
      ...dto,
      id: existing.id,
      creatorId: existing.creatorId,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };

    merged.duration = TimelineEngine.calculateTotalDuration(merged);

    const validation = TimelineEngine.validate(merged);
    if (!validation.valid) {
      throw AppError.badRequest(`प्रोजेक्ट सत्यापन त्रुटि: ${validation.errors.join(', ')}`);
    }

    return this.repository.updateProject(id, merged);
  }

  public async deleteProject(id: string, roles: string[] = []): Promise<boolean> {
    this.assertNotChiefEditor(roles);
    const existing = await this.getProjectById(id, roles);
    return this.repository.deleteProject(existing.id);
  }

  /**
   * Prefills a new Video Project from an existing news article.
   */
  public async prefillFromArticle(
    dto: PrefillFromArticleDto,
    creatorId: string,
    roles: string[] = []
  ): Promise<VideoProjectDocument> {
    this.assertNotChiefEditor(roles);

    if (!dto.articleId) {
      throw AppError.badRequest('आलेख ID (articleId) अनिवार्य है।');
    }

    const aspectRatio = dto.aspectRatio || '9:16';
    const preset = VIDEO_ASPECT_RATIO_PRESETS[aspectRatio];

    const targetDuration = dto.targetDurationSeconds || 30;
    const now = new Date().toISOString();
    const projectId = `vid-art-${randomUUID()}`;

    // Standard prefill structure
    const trkVId = `trk-v-${randomUUID()}`;
    const trkOId = `trk-o-${randomUUID()}`;
    const trkAId = `trk-a-${randomUUID()}`;

    const tracks: VideoTrack[] = [
      {
        id: trkVId,
        name: 'वीडियो फुटेज',
        type: 'video',
        order: 0,
        isLocked: false,
        isVisible: true,
        isMuted: false,
        clips: [
          ...(dto.includeIntroBumper !== false
            ? [
                {
                  id: `clp-in-${randomUUID()}`,
                  trackId: trkVId,
                  name: 'चैनल ओपनिंग बंपर (3s)',
                  clipType: 'intro' as const,
                  mediaUrl: CANONICAL_VIDEO_BRAND.introBumperUrl,
                  timelineStart: 0,
                  timelineDuration: 3,
                  sourceStart: 0,
                  sourceEnd: 3,
                  volume: 1,
                  opacity: 1,
                  properties: { isBumper: true },
                },
              ]
            : []),
          {
            id: `clp-main-${randomUUID()}`,
            trackId: trkVId,
            name: 'समाचार मुख्य विजुअल',
            clipType: 'video' as const,
            timelineStart: dto.includeIntroBumper !== false ? 3 : 0,
            timelineDuration: targetDuration - (dto.includeIntroBumper !== false ? 6 : 3),
            sourceStart: 0,
            sourceEnd: targetDuration - (dto.includeIntroBumper !== false ? 6 : 3),
            volume: 0.8,
            opacity: 1,
            properties: { articleId: dto.articleId },
          },
          ...(dto.includeOutroBumper !== false
            ? [
                {
                  id: `clp-out-${randomUUID()}`,
                  trackId: trkVId,
                  name: 'चैनल क्लोजिंग स्टिंग (3s)',
                  clipType: 'outro' as const,
                  mediaUrl: CANONICAL_VIDEO_BRAND.outroBumperUrl,
                  timelineStart: targetDuration - 3,
                  timelineDuration: 3,
                  sourceStart: 0,
                  sourceEnd: 3,
                  volume: 1,
                  opacity: 1,
                  properties: { isBumper: true },
                },
              ]
            : []),
        ],
      },
      {
        id: trkOId,
        name: 'लोअर थर्ड व टिकर पट्टी',
        type: 'graphics',
        order: 1,
        isLocked: false,
        isVisible: true,
        isMuted: false,
        clips: [
          {
            id: `clp-lt-${randomUUID()}`,
            trackId: trkOId,
            name: 'ब्रेकिंग टिकर',
            clipType: 'ticker' as const,
            timelineStart: dto.includeIntroBumper !== false ? 3 : 0,
            timelineDuration: targetDuration - 3,
            sourceStart: 0,
            sourceEnd: targetDuration - 3,
            volume: 0,
            opacity: 1,
            x: 0,
            y: aspectRatio === '9:16' ? 1700 : 950,
            properties: { preset: 'BREAKING_TICKER' },
          },
        ],
      },
      {
        id: trkAId,
        name: 'बैकग्राउंड संगीत',
        type: 'audio',
        order: 2,
        isLocked: false,
        isVisible: true,
        isMuted: false,
        clips: [
          {
            id: `clp-bgm-${randomUUID()}`,
            trackId: trkAId,
            name: 'समाचार पृष्ठभूमि संगीत',
            clipType: 'audio' as const,
            timelineStart: 0,
            timelineDuration: targetDuration,
            sourceStart: 0,
            sourceEnd: targetDuration,
            volume: 0.25,
            opacity: 1,
            properties: { loop: true },
          },
        ],
      },
    ];

    const projectDoc: VideoProjectDocument = {
      id: projectId,
      title: `आलेख #${dto.articleId.slice(0, 8)} से तैयार वीडियो`,
      description: `आलेख ${dto.articleId} से स्वतः जनरेटेड वीडियो प्रोजेक्ट`,
      aspectRatio,
      width: preset.width,
      height: preset.height,
      fps: preset.defaultFps,
      duration: targetDuration,
      tracks,
      associatedNewsId: dto.articleId,
      templateId: dto.templateId,
      brandProfileId: CANONICAL_VIDEO_BRAND.officialLogoHash,
      status: 'draft',
      version: 1,
      creatorId,
      createdAt: now,
      updatedAt: now,
    };

    projectDoc.duration = TimelineEngine.calculateTotalDuration(projectDoc);
    return this.repository.createProject(projectDoc);
  }

  // =========================================================================
  // Timeline Clip Manipulations
  // =========================================================================

  public async addClip(
    projectId: string,
    trackId: string,
    clipInput: Omit<VideoClip, 'id'> & { id?: string },
    roles: string[] = []
  ): Promise<VideoProjectDocument> {
    this.assertNotChiefEditor(roles);
    const project = await this.getProjectById(projectId, roles);
    const updated = TimelineEngine.addClip(project, trackId, clipInput);
    return this.repository.updateProject(projectId, updated);
  }

  public async removeClip(
    projectId: string,
    trackId: string,
    clipId: string,
    roles: string[] = []
  ): Promise<VideoProjectDocument> {
    this.assertNotChiefEditor(roles);
    const project = await this.getProjectById(projectId, roles);
    const updated = TimelineEngine.removeClip(project, trackId, clipId);
    return this.repository.updateProject(projectId, updated);
  }

  public async trimClip(
    projectId: string,
    trackId: string,
    clipId: string,
    trimIn: number,
    trimOut: number,
    roles: string[] = []
  ): Promise<VideoProjectDocument> {
    this.assertNotChiefEditor(roles);
    const project = await this.getProjectById(projectId, roles);
    const updated = TimelineEngine.trimClip(project, trackId, clipId, trimIn, trimOut);
    return this.repository.updateProject(projectId, updated);
  }

  public async splitClip(
    projectId: string,
    trackId: string,
    clipId: string,
    splitTimeSec: number,
    roles: string[] = []
  ): Promise<VideoProjectDocument> {
    this.assertNotChiefEditor(roles);
    const project = await this.getProjectById(projectId, roles);
    const updated = TimelineEngine.splitClip(project, trackId, clipId, splitTimeSec);
    return this.repository.updateProject(projectId, updated);
  }

  // =========================================================================
  // Subtitles & Captions
  // =========================================================================

  public async exportSubtitles(
    projectId: string,
    format: 'srt' | 'vtt',
    roles: string[] = []
  ): Promise<string> {
    this.assertNotChiefEditor(roles);
    const project = await this.getProjectById(projectId, roles);
    const cues = project.subtitles?.cues || [];

    if (format === 'vtt') {
      return TimelineEngine.exportToVtt(cues);
    }
    return TimelineEngine.exportToSrt(cues);
  }

  public async importSubtitles(
    projectId: string,
    srtContent: string,
    roles: string[] = []
  ): Promise<VideoProjectDocument> {
    this.assertNotChiefEditor(roles);
    const project = await this.getProjectById(projectId, roles);
    const parsedCues = TimelineEngine.parseSrt(srtContent);

    const updatedSubtitles = {
      id: project.subtitles?.id || `sub-${randomUUID()}`,
      language: 'hi',
      isBurnedIn: false,
      cues: parsedCues,
    };

    return this.updateProject(projectId, { subtitles: updatedSubtitles }, roles);
  }

  // =========================================================================
  // Render Queue & Export Operations
  // =========================================================================

  public async submitRenderJob(
    dto: SubmitRenderJobDto,
    roles: string[] = []
  ): Promise<VideoRenderJob> {
    this.assertNotChiefEditor(roles);

    const project = await this.getProjectById(dto.projectId, roles);
    const validation = TimelineEngine.validate(project);
    if (!validation.valid) {
      throw AppError.badRequest(
        `अवैध प्रोजेक्ट रेंडर नहीं किया जा सकता: ${validation.errors.join(', ')}`
      );
    }

    const jobId = `job-${randomUUID()}`;
    const now = new Date().toISOString();

    const renderJob: VideoRenderJob = {
      id: jobId,
      projectId: project.id,
      outputFormat: 'mp4',
      resolution: dto.resolution || '1080p',
      aspectRatio: project.aspectRatio,
      status: 'queued',
      progressPercent: 0,
      createdAt: now,
      statusMessage: 'रेंडरिंग कतार में सुरक्षित रूप से दर्ज',
    };

    const savedJob = await this.repository.createRenderJob(renderJob);

    // Update project state to rendering
    await this.repository.updateProject(project.id, { status: 'rendering' });

    // Asynchronous render execution (background processing)
    const outputPath = path.join(os.tmpdir(), `bnw-render-${jobId}.mp4`);

    this.processRenderJob(savedJob, project, outputPath).catch((err) => {
      // Background error is logged and saved in job status
      this.repository.updateRenderJob(savedJob.id, {
        status: 'failed',
        error: err.message,
        statusMessage: 'रेंडरिंग प्रक्रिया विफल हुई',
      });
    });

    return savedJob;
  }

  private async processRenderJob(
    job: VideoRenderJob,
    project: VideoProjectDocument,
    outputPath: string
  ): Promise<void> {
    try {
      await this.repository.updateRenderJob(job.id, {
        status: 'rendering',
        startedAt: new Date().toISOString(),
        statusMessage: 'FFmpeg एन्कोडिंग व फ़िल्टरग्राफ़ निष्पादन सक्रिय',
      });

      const result = await this.ffmpegService.renderProject(
        project,
        outputPath,
        job.resolution,
        async (progress) => {
          await this.repository.updateRenderJob(job.id, {
            progressPercent: progress,
            statusMessage: `प्रगति: ${progress}% पूर्ण`,
          });
        }
      );

      await this.repository.updateRenderJob(job.id, {
        status: 'completed',
        progressPercent: 100,
        statusMessage: 'वीडियो सफलतापूर्वक रेंडर हुआ',
        completedAt: new Date().toISOString(),
        fileSizeBytes: result.fileSizeBytes,
        durationSeconds: result.durationSeconds,
        outputUrl: `/media/rendered/${path.basename(outputPath)}`,
      });

      await this.repository.updateProject(project.id, { status: 'completed' });
    } catch (err: any) {
      await this.repository.updateRenderJob(job.id, {
        status: 'failed',
        error: err.message || 'अज्ञात FFmpeg विफलता',
        statusMessage: 'रेंडर त्रुटि',
      });
      await this.repository.updateProject(project.id, { status: 'failed' });
    }
  }

  public async getRenderJob(jobId: string, roles: string[] = []): Promise<VideoRenderJob> {
    this.assertNotChiefEditor(roles);
    const job = await this.repository.getRenderJobById(jobId);
    if (!job) {
      throw AppError.notFound(`रेंडर कार्य "${jobId}" नहीं मिला।`);
    }
    return job;
  }

  public async listRenderJobs(
    params: RenderJobFilterParams,
    roles: string[] = []
  ): Promise<{ items: VideoRenderJob[]; total: number }> {
    this.assertNotChiefEditor(roles);
    return this.repository.listRenderJobs(params);
  }

  public async cancelRenderJob(jobId: string, roles: string[] = []): Promise<VideoRenderJob> {
    this.assertNotChiefEditor(roles);
    const job = await this.getRenderJob(jobId, roles);
    if (job.status === 'completed' || job.status === 'failed') {
      throw AppError.badRequest(`कार्य "${jobId}" पहले से ही ${job.status} स्थिति में है।`);
    }

    return this.repository.updateRenderJob(jobId, {
      status: 'cancelled',
      statusMessage: 'उपयोगकर्ता द्वारा रेंडरिंग रद्द की गई',
    });
  }

  // =========================================================================
  // Video Template Operations
  // =========================================================================

  public async listTemplates(params: VideoTemplateFilterParams): Promise<VideoTemplate[]> {
    return this.repository.listTemplates(params);
  }

  public async getTemplateById(id: string): Promise<VideoTemplate> {
    const tpl = await this.repository.getTemplateById(id);
    if (!tpl) {
      throw AppError.notFound(`टेम्पलेट "${id}" नहीं मिला।`);
    }
    return tpl;
  }

  public async createTemplate(
    template: VideoTemplate,
    roles: string[] = []
  ): Promise<VideoTemplate> {
    this.assertNotChiefEditor(roles);
    return this.repository.createTemplate(template);
  }

  public async updateTemplate(
    id: string,
    updates: Partial<VideoTemplate>,
    roles: string[] = []
  ): Promise<VideoTemplate> {
    this.assertNotChiefEditor(roles);
    return this.repository.updateTemplate(id, updates);
  }

  // =========================================================================
  // AI Video Assistant (AGT-VID-009)
  // =========================================================================

  public async generateAiScript(
    req: AiVideoScriptRequest,
    roles: string[] = []
  ): Promise<AiVideoScriptResponse> {
    this.assertNotChiefEditor(roles);

    const headline = req.headline || 'मध्यप्रदेश ताज़ा समाचार बुलेटिन';
    const duration = req.targetDurationSeconds || 30;
    const district = req.district || 'मध्यप्रदेश';

    const scenes = [
      {
        sceneNumber: 1,
        durationSeconds: 3,
        shotType: 'opening_flash' as const,
        visualDescriptionHi: 'उच्च-ऊर्जा ब्रेकिंग न्यूज़ लाल बंपर और चैनल लोगो एनिमेशन।',
        voiceoverNarrationHi: `नमस्कार, आप देख रहे हैं ब्रेकिंग न्यूज़ वाला। ${district} से बड़ी ख़बर।`,
        lowerThirdText: {
          headlineHi: 'अति-महत्वपूर्ण ताज़ा अपडेट',
          sublineHi: `${district} ब्यूरो विशेष`,
        },
      },
      {
        sceneNumber: 2,
        durationSeconds: Math.max(10, duration - 10),
        shotType: 'b_roll_footage' as const,
        visualDescriptionHi: 'घटनास्थल के वास्तविक विजुअल्स, प्रशासनिक कार्रवाई और प्रत्यक्षदर्शी विवरण।',
        voiceoverNarrationHi: `${headline}। मामले की गंभीरता को देखते हुए उच्चाधिकारियों ने तुरंत संज्ञान लिया है और जांच जारी है।`,
        lowerThirdText: {
          headlineHi: headline,
          sublineHi: 'जांच जारी • विस्तृत रिपोर्ट',
        },
      },
      {
        sceneNumber: 3,
        durationSeconds: 4,
        shotType: 'reporter_standup' as const,
        visualDescriptionHi: 'संवाददाता माइक के साथ ज़मीनी स्थिति और अगले कदमों का संक्षिप्त विश्लेषण करते हुए।',
        voiceoverNarrationHi: 'हम इस मामले पर पल-पल की नज़र बनाए हुए हैं। आगे की जानकारी के लिए जुड़े रहें।',
        lowerThirdText: {
          headlineHi: `${district} से विशेष रिपोर्ट`,
          sublineHi: 'सच्चाई सबसे पहले',
        },
      },
      {
        sceneNumber: 4,
        durationSeconds: 3,
        shotType: 'outro_sting' as const,
        visualDescriptionHi: 'चैनल क्लोजिंग स्टिंग, शेयर एवं फ़ॉलो करने का कॉल-टू-एक्शन।',
        voiceoverNarrationHi: 'सटीक और निष्पक्ष समाचारों के लिए फ़ॉलो करें ब्रेकिंग न्यूज़ वाला।',
      },
    ];

    const suggestedSubtitleCues = scenes.map((s, idx) => ({
      id: `cue-ai-${idx + 1}`,
      startTime: idx === 0 ? 0.5 : scenes.slice(0, idx).reduce((acc, c) => acc + c.durationSeconds, 0),
      endTime: scenes.slice(0, idx + 1).reduce((acc, c) => acc + c.durationSeconds, 0),
      text: s.voiceoverNarrationHi,
      language: 'hi' as const,
    }));

    return {
      headlineHi: headline,
      totalEstimatedDuration: duration,
      scenes,
      suggestedSubtitleCues,
      suggestedBumper: CANONICAL_VIDEO_BRAND.introBumperUrl,
      musicMood: req.tone === 'ground_report' ? 'neutral_explainer' : 'urgent_breaking',
    };
  }

  public async suggestLowerThirds(
    req: AiVideoLowerThirdsRequest,
    roles: string[] = []
  ): Promise<AiVideoLowerThirdsResponse> {
    this.assertNotChiefEditor(roles);

    return {
      headlineHi: req.speakerName
        ? `${req.speakerName} (${req.speakerDesignation || 'अधिकारी'})`
        : req.topic,
      sublineHi: req.speakerName ? req.topic : 'ताज़ा बयान एवं ज़मीनी अपडेट',
      locationBadgeHi: req.location ? `${req.location} ब्यूरो` : 'मध्यप्रदेश ब्यूरो',
      recommendedDurationSec: 6.0,
    };
  }

  public async getInfrastructureHealth(): Promise<{
    ffmpegAvailable: boolean;
    ffmpegVersion: string;
    allowedCodecs: typeof VIDEO_ALLOWED_CODECS;
    constraints: typeof VIDEO_CONSTRAINTS;
  }> {
    const isAvail = await this.ffmpegService.getExecutor().isAvailable();
    const version = await this.ffmpegService.getExecutor().getVersion();
    return {
      ffmpegAvailable: isAvail,
      ffmpegVersion: version,
      allowedCodecs: VIDEO_ALLOWED_CODECS,
      constraints: VIDEO_CONSTRAINTS,
    };
  }
}
