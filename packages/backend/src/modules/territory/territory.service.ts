/**
 * BREAKING NEWS WALA — Territory Service Core
 * Grounded in docs/06-Business-Rules.md (RULE-LOC-001, RULE-LOC-002) and docs/13-API.md
 * Encapsulates geographic registry queries, hierarchy validation, and territory lookups.
 */

import { AppError } from '../../errors/app-error';
import { ITerritoryRepository, territoryRepository } from './territory.repository';
import {
  DistrictFilterParams,
  DistrictSummary,
  DivisionFilterParams,
  DivisionSummary,
  GeographicOverview,
  GeoLocationEntity,
  PaginatedResult,
  ReporterTerritoryAssignmentSummary,
  StateFilterParams,
  StateSummary,
} from './types';

export class TerritoryService {
  constructor(private readonly repo: ITerritoryRepository = territoryRepository) {}

  /**
   * Retrieves high-level geographic overview for platform clients.
   * Grounded in PRD & RULE-LOC-002: 1 State (Madhya Pradesh), 10 Divisions, 55 Districts.
   */
  public async getOverview(): Promise<GeographicOverview> {
    return this.repo.getOverview();
  }

  /**
   * Retrieves list of states with optional search, status filtering, and pagination.
   */
  public async getStates(params: StateFilterParams): Promise<PaginatedResult<StateSummary>> {
    return this.repo.findStates(params);
  }

  /**
   * Retrieves single state by UUID or slug with child divisions.
   */
  public async getStateBySlugOrId(idOrSlug: string): Promise<GeoLocationEntity> {
    const state = await this.repo.findStateByIdOrSlug(idOrSlug);
    if (!state) {
      throw AppError.notFound(`State "${idOrSlug}" not found in geographic registry.`);
    }
    return state;
  }

  /**
   * Retrieves list of administrative divisions with optional state filtering, search, and pagination.
   */
  public async getDivisions(params: DivisionFilterParams): Promise<PaginatedResult<DivisionSummary>> {
    return this.repo.findDivisions(params);
  }

  /**
   * Retrieves single division by UUID or slug with child districts.
   */
  public async getDivisionBySlugOrId(
    idOrSlug: string,
    includeDistricts: boolean = true
  ): Promise<GeoLocationEntity> {
    const division = await this.repo.findDivisionByIdOrSlug(idOrSlug, includeDistricts);
    if (!division) {
      throw AppError.notFound(`Administrative division "${idOrSlug}" not found.`);
    }
    return division;
  }

  /**
   * Retrieves list of districts with division filtering, search, sorting, and pagination.
   */
  public async getDistricts(params: DistrictFilterParams): Promise<PaginatedResult<DistrictSummary>> {
    return this.repo.findDistricts(params);
  }

  /**
   * Retrieves single district by UUID or slug with parent division and state hierarchy.
   */
  public async getDistrictBySlugOrId(idOrSlug: string): Promise<GeoLocationEntity> {
    const district = await this.repo.findDistrictByIdOrSlug(idOrSlug);
    if (!district) {
      throw AppError.notFound(`District "${idOrSlug}" not found.`);
    }
    return district;
  }

  /**
   * Retrieves active reporter beat/territory assignments.
   */
  public async getReporterAssignments(reporterId: string): Promise<ReporterTerritoryAssignmentSummary[]> {
    const assignments = await this.repo.findReporterAssignments(reporterId);
    return assignments.map((a) => ({
      id: a.id,
      reporterId: a.reporterId,
      locationId: a.locationId,
      locationNameHi: a.location?.nameHi || '',
      locationNameEn: a.location?.nameEn || '',
      locationSlug: a.location?.slug || '',
      locationLevel: a.location?.level || 'district',
      assignmentType: a.assignmentType,
      status: a.status,
      assignedAt: a.assignedAt.toISOString(),
    }));
  }

  /**
   * Validates whether a given district slug belongs to a specified division.
   */
  public async validateDistrictHierarchy(districtSlug: string, divisionSlug: string): Promise<boolean> {
    const district = await this.repo.findDistrictByIdOrSlug(districtSlug);
    if (!district || !district.parent) return false;
    return district.parent.slug === divisionSlug;
  }
}

export const territoryService = new TerritoryService();

