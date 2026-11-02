/**
 * BREAKING NEWS WALA — Video Studio & FFmpeg Pipeline Router
 * Grounded in docs/13-API.md, docs/12-Database.md (DOM-I),
 * and docs/DECISIONS.md (DEC-025, DEC-026, DEC-048)
 */

import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';

const videoService = new VideoService();
const videoController = new VideoController(videoService);

// 1. General Video Studio Router (`/api/v1/video/*`)
const videoRouter = Router();

// Project Management
videoRouter.post('/projects', requireAuth, videoController.createProject);
videoRouter.get('/projects', requireAuth, videoController.listProjects);
videoRouter.get('/projects/:id', requireAuth, videoController.getProjectById);
videoRouter.put('/projects/:id', requireAuth, videoController.updateProject);
videoRouter.delete('/projects/:id', requireAuth, videoController.deleteProject);
videoRouter.post('/projects/prefill-from-article', requireAuth, videoController.prefillFromArticle);

// Timeline Clip Operations
videoRouter.post('/projects/:id/clips', requireAuth, videoController.addClip);
videoRouter.delete('/projects/:id/clips/:clipId', requireAuth, videoController.removeClip);
videoRouter.put('/projects/:id/clips/:clipId/trim', requireAuth, videoController.trimClip);
videoRouter.post('/projects/:id/clips/:clipId/split', requireAuth, videoController.splitClip);

// Subtitles
videoRouter.get('/projects/:id/subtitles', requireAuth, videoController.exportSubtitles);
videoRouter.post('/projects/:id/subtitles', requireAuth, videoController.importSubtitles);

// Templates Catalog
videoRouter.get('/templates', requireAuth, videoController.listTemplates);
videoRouter.get('/templates/:id', requireAuth, videoController.getTemplateById);

// Render Queue & Execution
videoRouter.post('/render', requireAuth, videoController.submitRenderJob);
videoRouter.get('/render/jobs', requireAuth, videoController.listRenderJobs);
videoRouter.get('/render/:jobId', requireAuth, videoController.getRenderJob);
videoRouter.post('/render/:jobId/cancel', requireAuth, videoController.cancelRenderJob);

// AI Video Assistant (AGT-VID-009)
videoRouter.post('/ai/script', requireAuth, videoController.generateAiScript);
videoRouter.post('/ai/lower-thirds', requireAuth, videoController.suggestLowerThirds);

// Health & Capabilities
videoRouter.get('/health', requireAuth, videoController.getHealth);

// 2. Admin Video Management Router (`/api/v1/admin/video/*`)
const adminVideoRouter = Router();

adminVideoRouter.get('/health', requireAuth, videoController.getHealth);
adminVideoRouter.get('/templates', requireAuth, videoController.listTemplates);
adminVideoRouter.post('/templates', requireAuth, videoController.createTemplate);
adminVideoRouter.put('/templates/:id', requireAuth, videoController.updateTemplate);
adminVideoRouter.get('/queue/status', requireAuth, videoController.listRenderJobs);
adminVideoRouter.get('/jobs', requireAuth, videoController.listRenderJobs);
adminVideoRouter.post('/jobs/:jobId/cancel', requireAuth, videoController.cancelRenderJob);

export { videoRouter, adminVideoRouter, videoService, videoController };

