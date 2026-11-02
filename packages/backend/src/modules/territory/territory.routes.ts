/**
 * BREAKING NEWS WALA — Territory Router
 * Grounded in docs/06-Business-Rules.md (RULE-LOC-001, RULE-LOC-002) and docs/13-API.md
 * Mounts public geographic queries and authenticated reporter assignment lookups.
 */

import { Router } from 'express';
import { territoryController } from './territory.controller';
import { validateIdOrSlug, validateTerritoryQuery } from './territory.validator';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// Geographic Registry Overview
router.get('/overview', territoryController.getOverview);

// State Endpoints
router.get('/states', validateTerritoryQuery, territoryController.getStates);
router.get('/states/:idOrSlug', validateIdOrSlug, territoryController.getState);

// Division Endpoints
router.get('/divisions', validateTerritoryQuery, territoryController.getDivisions);
router.get('/divisions/:idOrSlug', validateIdOrSlug, territoryController.getDivision);

// District Endpoints
router.get('/districts', validateTerritoryQuery, territoryController.getDistricts);
router.get('/districts/:idOrSlug', validateIdOrSlug, territoryController.getDistrict);

// Authenticated Reporter Beat/Territory Inquiries
router.get('/my-assignments', requireAuth, territoryController.getMyAssignments);

export { router as territoryRouter };

