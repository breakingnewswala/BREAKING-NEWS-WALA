/**
 * BREAKING NEWS WALA — Territory & Geographic Registry Types
 * Grounded in docs/06-Business-Rules.md (RULE-LOC-001, RULE-LOC-002),
 * docs/12-Database.md (DOM-C), and docs/13-API.md
 */

export type GeoLevel = 'country' | 'state' | 'division' | 'district' | 'city' | 'tehsil';

export interface GeoLocationEntity {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  level: string;
  parentId: string | null;
  stateCode: string | null;
  latitude?: any;
  longitude?: any;
  displayOrder: number;
  isActive: boolean;
  parent?: GeoLocationEntity | null;
  children?: GeoLocationEntity[];
}

export interface StateSummary {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  stateCode: string | null;
  displayOrder: number;
  isActive: boolean;
  divisionsCount?: number;
  districtsCount?: number;
}

export interface DivisionSummary {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  stateId: string | null;
  stateCode: string | null;
  displayOrder: number;
  isActive: boolean;
  districtsCount?: number;
  districts?: DistrictSummary[];
}

export interface DistrictSummary {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  divisionId: string | null;
  divisionNameHi?: string;
  divisionNameEn?: string;
  stateCode: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface GeographicOverview {
  totalStates: number;
  totalDivisions: number;
  totalDistricts: number;
  primaryState: {
    id: string;
    nameHi: string;
    nameEn: string;
    slug: string;
    stateCode: string;
  };
  divisions: Array<{
    id: string;
    nameHi: string;
    nameEn: string;
    slug: string;
    displayOrder: number;
    districtsCount: number;
    districts: DistrictSummary[];
  }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface StateFilterParams extends PaginationParams {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface DivisionFilterParams extends PaginationParams {
  stateId?: string;
  stateSlug?: string;
  stateCode?: string;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  includeDistricts?: boolean;
}

export interface DistrictFilterParams extends PaginationParams {
  stateId?: string;
  stateSlug?: string;
  stateCode?: string;
  divisionId?: string;
  divisionSlug?: string;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  sortBy?: 'displayOrder' | 'nameEn' | 'nameHi';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReporterTerritoryAssignmentEntity {
  id: string;
  reporterId: string;
  locationId: string;
  assignmentType: string; // PRIMARY, SECONDARY, BEAT
  assignedBy: string | null;
  assignedAt: Date;
  status: string;
  location?: GeoLocationEntity;
}

export interface ReporterTerritoryAssignmentSummary {
  id: string;
  reporterId: string;
  locationId: string;
  locationNameHi: string;
  locationNameEn: string;
  locationSlug: string;
  locationLevel: string;
  assignmentType: string;
  status: string;
  assignedAt: string;
}
