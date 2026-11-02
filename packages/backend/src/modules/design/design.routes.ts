/**
 * BREAKING NEWS WALA — Design & Graphics Studio Router
 * Grounded in docs/13-API.md and docs/DECISIONS.md (DEC-025, DEC-026)
 */

import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { DesignService } from './design.service';
import { DesignController } from './design.controller';

const designService = new DesignService();
const designController = new DesignController(designService);

// 1. General Design Studio Router (`/api/v1/design/*`)
const designRouter = Router();

designRouter.post('/', requireAuth, designController.createDesign);
designRouter.get('/', requireAuth, designController.listDesigns);
designRouter.get('/brand-profile', requireAuth, designController.getBrandProfile);
designRouter.post('/prefill', requireAuth, designController.prefillFromArticle);
designRouter.post('/ai-concept', requireAuth, designController.generateAiConcept);
designRouter.get('/:id', requireAuth, designController.getDesign);
designRouter.patch('/:id', requireAuth, designController.updateDesign);
designRouter.post('/:id/duplicate', requireAuth, designController.duplicateDesign);
designRouter.delete('/:id', requireAuth, designController.deleteDesign);
designRouter.post('/:id/export', requireAuth, designController.exportDesign);

// 2. Templates Router (`/api/v1/templates/*`)
const templateRouter = Router();

templateRouter.get('/', requireAuth, designController.listTemplates);
templateRouter.get('/:id', requireAuth, designController.getTemplate);

// 3. Admin Design Management Router (`/api/v1/admin/design/*`)
const adminDesignRouter = Router();

adminDesignRouter.get('/templates', requireAuth, designController.listTemplates);
adminDesignRouter.post('/templates', requireAuth, designController.createTemplate);
adminDesignRouter.patch('/templates/:id', requireAuth, designController.updateTemplate);
adminDesignRouter.post('/templates/:id/publish', requireAuth, designController.publishTemplate);
adminDesignRouter.post('/templates/:id/archive', requireAuth, designController.archiveTemplate);

export { designRouter, templateRouter, adminDesignRouter, designService, designController };

