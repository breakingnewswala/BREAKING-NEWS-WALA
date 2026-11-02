/**
 * BREAKING NEWS WALA — Central Ingress Router
 * Routes ingress HTTP traffic to appropriate API version handlers.
 */

import { Router } from 'express';
import { v1Router } from './v1/index.router';

const router = Router();

// Mount API v1 Ingress
router.use('/api/v1', v1Router);

export { router as rootRouter };

