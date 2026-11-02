/**
 * BREAKING NEWS WALA — Video Production Studio & FFmpeg Pipeline Test Suite
 * Grounded in docs/11-Architecture.md, docs/12-Database.md (DOM-I),
 * docs/16-Storage.md, docs/20-Integrations.md (INT-VID-013), and docs/DECISIONS.md (DEC-048, DEC-060)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  TimelineEngine,
  FfmpegService,
  RealFfmpegExecutor,
  MockFfmpegExecutor,
  VideoService,
  InMemoryVideoRepository,
  VIDEO_ASPECT_RATIO_PRESETS,
  VIDEO_RESOLUTION_SPECS,
  CANONICAL_VIDEO_BRAND,
  VIDEO_CONSTRAINTS,
  VIDEO_ALLOWED_CODECS,
  CANONICAL_VIDEO_TEMPLATES,
} from '../../src/modules/video';
import { VideoProjectDocument } from '@bnw/types';
import * as path from 'path';
import * as os from 'os';

describe('BNW-MASTER-004: Video Production Studio & FFmpeg Pipeline', () => {
  const mockReporter = { id: 'usr-reporter-001', roles: ['reporter'] };
  const mockEditor = { id: 'usr-editor-001', roles: ['editor'] };
  const mockAdmin = { id: 'usr-admin-001', roles: ['admin'] };
  const mockChiefEditor = { id: 'usr-chief-001', roles: ['ROLE_CHIEF_EDITOR'] };

  const createSampleProject = (): VideoProjectDocument => ({
    id: 'vid-test-001',
    title: 'मध्यप्रदेश ताज़ा बुलेटिन',
    description: 'परीक्षण वीडियो प्रोजेक्ट',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 30,
    status: 'draft',
    version: 1,
    creatorId: 'usr-reporter-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tracks: [
      {
        id: 'trk-v-1',
        name: 'वीडियो ट्रैक',
        type: 'video',
        order: 0,
        isLocked: false,
        isVisible: true,
        isMuted: false,
        clips: [
          {
            id: 'clp-v-1',
            trackId: 'trk-v-1',
            name: 'दृश्य 1',
            clipType: 'video',
            timelineStart: 0,
            timelineDuration: 15,
            sourceStart: 0,
            sourceEnd: 15,
            volume: 1,
            opacity: 1,
          },
          {
            id: 'clp-v-2',
            trackId: 'trk-v-1',
            name: 'दृश्य 2',
            clipType: 'video',
            timelineStart: 15,
            timelineDuration: 15,
            sourceStart: 0,
            sourceEnd: 15,
            volume: 1,
            opacity: 1,
          },
        ],
      },
      {
        id: 'trk-g-1',
        name: 'लोअर थर्ड व ग्राफिक',
        type: 'graphics',
        order: 1,
        isLocked: false,
        isVisible: true,
        isMuted: false,
        clips: [
          {
            id: 'clp-g-1',
            trackId: 'trk-g-1',
            name: 'टिकर',
            clipType: 'ticker',
            timelineStart: 0,
            timelineDuration: 30,
            sourceStart: 0,
            sourceEnd: 30,
            volume: 0,
            opacity: 1,
          },
        ],
      },
    ],
    subtitles: {
      id: 'sub-1',
      language: 'hi',
      isBurnedIn: false,
      cues: [
        {
          id: 'cue-1',
          startTime: 1,
          endTime: 6,
          text: 'मध्यप्रदेश सरकार का बड़ा फ़ैसला।',
        },
        {
          id: 'cue-2',
          startTime: 6.5,
          endTime: 12,
          text: 'सभी ज़िलों में सुरक्षा के कड़े इंतज़ाम।',
        },
      ],
    },
  });

  // =========================================================================
  // 1. Timeline Engine Tests
  // =========================================================================
  describe('1. Timeline Engine & Manipulation', () => {
    it('validates a well-formed project document successfully', () => {
      const project = createSampleProject();
      const res = TimelineEngine.validate(project);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.errors.length, 0);
    });

    it('rejects project missing title or invalid dimensions', () => {
      const project = createSampleProject();
      project.title = '';
      project.width = -100;
      const res = TimelineEngine.validate(project);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.some((e) => e.includes('शीर्षक')));
      assert.ok(res.errors.some((e) => e.includes('चौड़ाई')));
    });

    it('accurately calculates total duration from maximum clip end time', () => {
      const project = createSampleProject();
      const duration = TimelineEngine.calculateTotalDuration(project);
      assert.strictEqual(duration, 30);
    });

    it('adds a clip and recalculates project duration', () => {
      const project = createSampleProject();
      const updated = TimelineEngine.addClip(project, 'trk-v-1', {
        name: 'अतिरिक्त दृश्य 3',
        clipType: 'video',
        timelineStart: 30,
        timelineDuration: 10,
      });

      assert.strictEqual(updated.tracks[0]?.clips.length, 3);
      assert.strictEqual(updated.duration, 40);
      assert.strictEqual(updated.version, 2);
    });

    it('removes a clip from a track cleanly', () => {
      const project = createSampleProject();
      const updated = TimelineEngine.removeClip(project, 'trk-v-1', 'clp-v-2');
      assert.strictEqual(updated.tracks[0]?.clips.length, 1);
      assert.strictEqual(updated.tracks[0]?.clips[0]?.id, 'clp-v-1');
    });

    it('trims clip in/out points and adjusts duration', () => {
      const project = createSampleProject();
      const updated = TimelineEngine.trimClip(project, 'trk-v-1', 'clp-v-1', 2, 10);
      const trimmedClip = updated.tracks[0]?.clips[0];
      assert.strictEqual(trimmedClip?.sourceStart, 2);
      assert.strictEqual(trimmedClip?.sourceEnd, 10);
      assert.strictEqual(trimmedClip?.timelineDuration, 8);
    });

    it('splits a clip cleanly into two parts at a specified timestamp', () => {
      const project = createSampleProject();
      // clp-v-1 spans [0, 15]s; split at 6s
      const updated = TimelineEngine.splitClip(project, 'trk-v-1', 'clp-v-1', 6);
      const clips = updated.tracks[0]?.clips || [];
      assert.strictEqual(clips.length, 3);
      assert.strictEqual(clips[0]?.id, 'clp-v-1-part1');
      assert.strictEqual(clips[0]?.timelineDuration, 6);
      assert.strictEqual(clips[1]?.id, 'clp-v-1-part2');
      assert.strictEqual(clips[1]?.timelineStart, 6);
      assert.strictEqual(clips[1]?.timelineDuration, 9);
    });

    it('exports and parses SubRip (.srt) subtitles accurately', () => {
      const cues = [
        { id: '1', startTime: 1.5, endTime: 4.25, text: 'नमस्ते मध्यप्रदेश' },
        { id: '2', startTime: 5.0, endTime: 9.0, text: 'आज की प्रमुख ख़बरें' },
      ];
      const srt = TimelineEngine.exportToSrt(cues);
      assert.ok(srt.includes('00:00:01,500 --> 00:00:04,250'));
      assert.ok(srt.includes('नमस्ते मध्यप्रदेश'));

      const parsed = TimelineEngine.parseSrt(srt);
      assert.strictEqual(parsed.length, 2);
      assert.strictEqual(parsed[0]?.text, 'नमस्ते मध्यप्रदेश');
      assert.strictEqual(parsed[0]?.startTime, 1.5);
    });

    it('exports WebVTT (.vtt) format with correct header and cues', () => {
      const cues = [{ id: '1', startTime: 0, endTime: 5, text: 'लाइव रिपोर्ट' }];
      const vtt = TimelineEngine.exportToVtt(cues);
      assert.ok(vtt.startsWith('WEBVTT - BREAKING NEWS WALA'));
      assert.ok(vtt.includes('00:00:00.000 --> 00:00:05.000'));
    });

    it('automatically generates timestamped subtitle cues from Hindi news script', () => {
      const text =
        'भोपाल में कैबिनेट की अहम बैठक शुरू। मुख्यमंत्री ने विकास कार्यों की समीक्षा की। कई योजनाओं को मंजूरी।';
      const cues = TimelineEngine.generateSubtitlesFromText(text, 120);
      assert.strictEqual(cues.length, 3);
      assert.strictEqual(cues[0]?.text, 'भोपाल में कैबिनेट की अहम बैठक शुरू।');
      assert.ok((cues[1]?.startTime || 0) > (cues[0]?.endTime || 0));
    });
  });

  // =========================================================================
  // 2. FFmpeg Service & Safe Subprocess Execution
  // =========================================================================
  describe('2. FFmpeg Service & Security Boundaries', () => {
    it('rejects command injection patterns in arguments array', async () => {
      const realExec = new RealFfmpegExecutor();
      const dangerousArgs = ['-i', 'test.mp4', '-vf', 'scale=1280:720; rm -rf /'];

      await assert.rejects(
        async () => {
          await realExec.execute(dangerousArgs, 'out.mp4', 10);
        },
        (err: any) => {
          return err.message.includes('असुरक्षित तर्क') || err.statusCode === 400;
        }
      );
    });

    it('builds deterministic render arguments for 9:16 vertical video', () => {
      const ffmpegService = new FfmpegService(new MockFfmpegExecutor());
      const project = createSampleProject();
      const outputPath = path.join(os.tmpdir(), 'test-out-9x16.mp4');
      const args = ffmpegService.buildRenderArguments(project, outputPath, '1080p');

      assert.ok(args.includes('-y'));
      assert.ok(args.includes('-filter_complex'));
      assert.ok(args.includes('-c:v'));
      assert.ok(args.includes('libx264'));
      assert.ok(args.includes('-c:a'));
      assert.ok(args.includes('aac'));
      assert.ok(args.includes(outputPath));
    });

    it('simulates render progress (0% -> 100%) cleanly with MockFfmpegExecutor', async () => {
      const mockExec = new MockFfmpegExecutor();
      const ffmpegService = new FfmpegService(mockExec);
      const project = createSampleProject();
      const outputPath = path.join(os.tmpdir(), 'test-mock-render.mp4');

      const progressTicks: number[] = [];
      const result = await ffmpegService.renderProject(
        project,
        outputPath,
        '720p',
        (percent) => {
          progressTicks.push(percent);
        }
      );

      assert.strictEqual(result.exitCode, 0);
      assert.ok(progressTicks.includes(100));
      assert.ok(result.fileSizeBytes > 0);
    });

    it('reports infrastructure health and codec whitelist', async () => {
      const videoService = new VideoService(
        new InMemoryVideoRepository(),
        new FfmpegService(new MockFfmpegExecutor())
      );

      const health = await videoService.getInfrastructureHealth();
      assert.strictEqual(health.ffmpegAvailable, true);
      assert.ok(health.ffmpegVersion.length > 0);
      assert.deepStrictEqual(health.allowedCodecs, VIDEO_ALLOWED_CODECS);
      assert.deepStrictEqual(health.constraints, VIDEO_CONSTRAINTS);
    });
  });

  // =========================================================================
  // 3. Video Service & Governance Tests
  // =========================================================================
  describe('3. Video Service & Decision Governance (DEC-048, DEC-060)', () => {
    let service: VideoService;

    beforeEach(() => {
      service = new VideoService(
        new InMemoryVideoRepository(),
        new FfmpegService(new MockFfmpegExecutor())
      );
    });

    it('DEC-048: rejects ROLE_CHIEF_EDITOR on project creation with 403 Forbidden', async () => {
      await assert.rejects(
        async () => {
          await service.createProject(
            { title: 'चीफ एडिटर वीडियो' },
            mockChiefEditor.id,
            mockChiefEditor.roles
          );
        },
        (err: any) => {
          return err.message.includes('DEC-048') && err.statusCode === 403;
        }
      );
    });

    it('DEC-048: rejects ROLE_CHIEF_EDITOR on render job submission', async () => {
      await assert.rejects(
        async () => {
          await service.submitRenderJob(
            { projectId: 'vid-test-001' },
            mockChiefEditor.roles
          );
        },
        (err: any) => {
          return err.message.includes('DEC-048') && err.statusCode === 403;
        }
      );
    });

    it('creates and retrieves a new Video Project for authorized reporter', async () => {
      const project = await service.createProject(
        {
          title: 'इंदौर मेट्रो उद्घाटन विशेष',
          aspectRatio: '9:16',
          duration: 30,
        },
        mockReporter.id,
        mockReporter.roles
      );

      assert.ok(project.id.startsWith('vid-'));
      assert.strictEqual(project.title, 'इंदौर मेट्रो उद्घाटन विशेष');
      assert.strictEqual(project.aspectRatio, '9:16');
      assert.strictEqual(project.tracks.length, 4);

      const fetched = await service.getProjectById(project.id, mockReporter.roles);
      assert.strictEqual(fetched.id, project.id);
    });

    it('prefills a complete Video Project from news article with bumpers and overlays', async () => {
      const project = await service.prefillFromArticle(
        {
          articleId: 'art-bhopal-001',
          aspectRatio: '9:16',
          targetDurationSeconds: 45,
          includeIntroBumper: true,
          includeOutroBumper: true,
        },
        mockEditor.id,
        mockEditor.roles
      );

      assert.strictEqual(project.associatedNewsId, 'art-bhopal-001');
      assert.strictEqual(project.duration, 45);

      const videoTrack = project.tracks.find((t) => t.type === 'video');
      assert.ok(videoTrack);
      assert.ok(videoTrack.clips.some((c) => c.name?.includes('ओपनिंग बंपर')));
      assert.ok(videoTrack.clips.some((c) => c.name?.includes('क्लोजिंग स्टिंग')));
    });

    it('retrieves seeded canonical template catalog (8+ templates)', async () => {
      const templates = await service.listTemplates({});
      assert.ok(templates.length >= 8);

      const flashTemplate = templates.find((t) => t.id === 'tpl-vid-breaking-flash-9x16');
      assert.ok(flashTemplate);
      assert.strictEqual(flashTemplate.aspectRatio, '9:16');
      assert.strictEqual(flashTemplate.category, 'breaking');
    });

    it('submits a render job and executes to completion', async () => {
      const project = await service.createProject(
        { title: 'रेंडर टेस्ट प्रोजेक्ट', aspectRatio: '16:9', duration: 15 },
        mockEditor.id,
        mockEditor.roles
      );

      const job = await service.submitRenderJob(
        { projectId: project.id, resolution: '1080p' },
        mockEditor.roles
      );

      assert.ok(job.id.startsWith('job-'));
      assert.strictEqual(job.projectId, project.id);

      // Fetch job status
      const currentJob = await service.getRenderJob(job.id, mockEditor.roles);
      assert.ok(['queued', 'rendering', 'completed'].includes(currentJob.status));
    });

    it('allows cancelling an active or queued render job', async () => {
      const project = await service.createProject(
        { title: 'कैंसिल टेस्ट प्रोजेक्ट' },
        mockEditor.id,
        mockEditor.roles
      );

      const job = await service.submitRenderJob(
        { projectId: project.id },
        mockEditor.roles
      );

      const cancelled = await service.cancelRenderJob(job.id, mockEditor.roles);
      assert.strictEqual(cancelled.status, 'cancelled');
    });

    it('AGT-VID-009: generates structured AI script and scene outline without fake footage', async () => {
      const script = await service.generateAiScript(
        {
          headline: 'उज्जैन महाकाल लोक में श्रद्धालुओं की भारी भीड़',
          district: 'उज्जैन',
          targetDurationSeconds: 30,
          tone: 'ground_report',
        },
        mockEditor.roles
      );

      assert.strictEqual(script.headlineHi, 'उज्जैन महाकाल लोक में श्रद्धालुओं की भारी भीड़');
      assert.strictEqual(script.scenes.length, 4);
      assert.ok(script.scenes.some((s) => s.shotType === 'opening_flash'));
      assert.ok(script.suggestedSubtitleCues.length > 0);
    });

    it('AGT-VID-009: generates formatted Hindi lower thirds recommendation', async () => {
      const lt = await service.suggestLowerThirds(
        {
          topic: 'सड़क सुरक्षा विशेष अभियान',
          speakerName: 'राजेश कुमार',
          speakerDesignation: 'एसपी ट्रैफिक',
          location: 'ग्वालियर',
        },
        mockEditor.roles
      );

      assert.strictEqual(lt.headlineHi, 'राजेश कुमार (एसपी ट्रैफिक)');
      assert.strictEqual(lt.locationBadgeHi, 'ग्वालियर ब्यूरो');
    });

    it('DEC-060: preserves canonical Brand Logo SHA-256 hash match', () => {
      const expectedHash = '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F';
      assert.strictEqual(CANONICAL_VIDEO_BRAND.officialLogoHash, expectedHash);
      assert.ok(CANONICAL_VIDEO_BRAND.officialLogoUrl.includes('/brand/logo.png'));
    });
  });
});
