/**
 * BREAKING NEWS WALA — Integrations & Social Publishing Routes
 * Grounded in docs/13-API.md, docs/20-Integrations.md, docs/DECISIONS.md
 */

import { Router } from 'express';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { InMemoryIntegrationsRepository } from './integrations.repository';

// Standard singleton service instantiation for default router
export const defaultIntegrationsRepository = new InMemoryIntegrationsRepository();
export const defaultIntegrationsService = new IntegrationsService(defaultIntegrationsRepository);
export const defaultIntegrationsController = new IntegrationsController(defaultIntegrationsService);

// 1. Social Media Publishing Newsroom Router
export const socialRouter = Router();

// Platform Constraints & Accounts
socialRouter.get('/platforms/constraints', defaultIntegrationsController.getPlatformConstraints);
socialRouter.get('/accounts', defaultIntegrationsController.getSocialAccounts);
socialRouter.get('/accounts/:id', defaultIntegrationsController.getSocialAccount);

// OAuth flows
socialRouter.post('/oauth/:platform/authorize', defaultIntegrationsController.generateOAuthUrl);
socialRouter.post('/oauth/:platform/callback', defaultIntegrationsController.handleOAuthCallback);

// Publishing Workflow
socialRouter.get('/publishing', defaultIntegrationsController.getPublishingJobs);
socialRouter.get('/publishing/:id', defaultIntegrationsController.getPublishingJob);
socialRouter.post('/publishing', defaultIntegrationsController.createPublishingJob);
socialRouter.put('/publishing/:id', defaultIntegrationsController.updatePublishingJob);
socialRouter.post('/publishing/:id/approve', defaultIntegrationsController.approvePublishingJob);
socialRouter.post('/publishing/:id/schedule', defaultIntegrationsController.schedulePublishingJob);
socialRouter.post('/publishing/:id/cancel', defaultIntegrationsController.cancelPublishingJob);
socialRouter.post('/publishing/:id/publish', defaultIntegrationsController.publishImmediately);
socialRouter.post('/publishing/deliveries/:deliveryId/retry', defaultIntegrationsController.retryDelivery);

// Webhook Ingress
socialRouter.post('/webhooks/:provider', defaultIntegrationsController.handleWebhookIngress);

// 2. Admin Integrations & API Pool Router
export const adminIntegrationsRouter = Router();

// Provider Registry & API Pool
adminIntegrationsRouter.get('/providers', defaultIntegrationsController.getProviders);
adminIntegrationsRouter.post('/providers', defaultIntegrationsController.registerProvider);
adminIntegrationsRouter.get('/providers/:id', defaultIntegrationsController.getProvider);
adminIntegrationsRouter.put('/providers/:id', defaultIntegrationsController.updateProvider);
adminIntegrationsRouter.post('/providers/:id/health', defaultIntegrationsController.testProviderHealth);

// Webhook Ingress Logs
adminIntegrationsRouter.get('/webhooks/logs', defaultIntegrationsController.getWebhookLogs);

// 3. Admin Social Media Account Router
export const adminSocialRouter = Router();

adminSocialRouter.get('/accounts', defaultIntegrationsController.getSocialAccounts);
adminSocialRouter.post('/accounts', defaultIntegrationsController.connectSocialAccount);
adminSocialRouter.get('/accounts/:id', defaultIntegrationsController.getSocialAccount);
adminSocialRouter.patch('/accounts/:id/toggle', defaultIntegrationsController.toggleSocialAccount);
adminSocialRouter.post('/accounts/:id/disconnect', defaultIntegrationsController.disconnectSocialAccount);

