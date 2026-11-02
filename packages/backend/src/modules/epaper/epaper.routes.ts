/**
 * BREAKING NEWS WALA — E-Paper Routes
 */

import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { epaperController } from './epaper.controller';
import { validateCreateEdition } from './epaper.validator';

const publicRouter = Router();
const adminRouter = Router();

// Public reader routes
publicRouter.get('/editions', epaperController.getPublicEditions);
publicRouter.get('/latest', epaperController.getLatestEdition);
publicRouter.get('/editions/:id', epaperController.getPublicEditionById);
publicRouter.post('/editions/:id/view', epaperController.recordView);
publicRouter.post('/editions/:id/download', epaperController.recordDownload);

// Admin / editorial routes
adminRouter.get('/editions', requireAuth, epaperController.getAllEditionsAdmin);
adminRouter.get('/editions/:id', requireAuth, epaperController.getEditionByIdAdmin);
adminRouter.post('/editions', requireAuth, validateCreateEdition, epaperController.createEdition);
adminRouter.put('/editions/:id', requireAuth, epaperController.updateEdition);
adminRouter.post('/editions/:id/transition', requireAuth, epaperController.transitionStatus);
adminRouter.post('/editions/:id/pages', requireAuth, epaperController.addPage);
adminRouter.delete('/editions/:id', requireAuth, epaperController.deleteEdition);

export { publicRouter as epaperRouter, adminRouter as adminEpaperRouter };
