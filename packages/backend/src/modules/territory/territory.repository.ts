/**
 * BREAKING NEWS WALA — Territory Repository Boundary
 * Grounded in docs/06-Business-Rules.md (RULE-LOC-001, RULE-LOC-002) and docs/12-Database.md
 * Encapsulates database operations for GeoLocation and ReporterTerritoryAssignment models.
 */

import { getPrismaClient } from '../../db/client';
import { MP_DIVISIONS_AND_DISTRICTS } from './geo-data';
import {
  DistrictFilterParams,
  DistrictSummary,
  DivisionFilterParams,
  DivisionSummary,
  GeographicOverview,
  GeoLocationEntity,
  PaginatedResult,
  ReporterTerritoryAssignmentEntity,
  StateFilterParams,
  StateSummary,
} from './types';

export interface ITerritoryRepository {
  getOverview(): Promise<GeographicOverview>;
  findStates(params: StateFilterParams): Promise<PaginatedResult<StateSummary>>;
  findStateByIdOrSlug(idOrSlug: string): Promise<GeoLocationEntity | null>;
  findDivisions(params: DivisionFilterParams): Promise<PaginatedResult<DivisionSummary>>;
  findDivisionByIdOrSlug(idOrSlug: string, includeDistricts?: boolean): Promise<GeoLocationEntity | null>;
  findDistricts(params: DistrictFilterParams): Promise<PaginatedResult<DistrictSummary>>;
  findDistrictByIdOrSlug(idOrSlug: string): Promise<GeoLocationEntity | null>;
  findReporterAssignments(reporterId: string): Promise<ReporterTerritoryAssignmentEntity[]>;
}

export class PrismaTerritoryRepository implements ITerritoryRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async getOverview(): Promise<GeographicOverview> {
    const states = await this.prisma.geoLocation.findMany({
      where: { level: 'state', isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    const divisions = await this.prisma.geoLocation.findMany({
      where: { level: 'division', isActive: true },
      include: {
        children: {
          where: { level: 'district', isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    const districtsCount = await this.prisma.geoLocation.count({
      where: { level: 'district', isActive: true },
    });

    const primaryState = states[0] || {
      id: '00000000-0000-0000-0000-000000000001',
      nameHi: 'मध्य प्रदेश',
      nameEn: 'Madhya Pradesh',
      slug: 'madhya-pradesh',
      stateCode: 'MP',
    };

    return {
      totalStates: states.length,
      totalDivisions: divisions.length,
      totalDistricts: districtsCount,
      primaryState: {
        id: primaryState.id,
        nameHi: primaryState.nameHi,
        nameEn: primaryState.nameEn,
        slug: primaryState.slug,
        stateCode: primaryState.stateCode || 'MP',
      },
      divisions: divisions.map((div) => ({
        id: div.id,
        nameHi: div.nameHi,
        nameEn: div.nameEn,
        slug: div.slug,
        displayOrder: div.displayOrder,
        districtsCount: div.children.length,
        districts: div.children.map((dist) => ({
          id: dist.id,
          nameHi: dist.nameHi,
          nameEn: dist.nameEn,
          slug: dist.slug,
          divisionId: div.id,
          divisionNameHi: div.nameHi,
          divisionNameEn: div.nameEn,
          stateCode: dist.stateCode,
          displayOrder: dist.displayOrder,
          isActive: dist.isActive,
        })),
      })),
    };
  }

  public async findStates(params: StateFilterParams): Promise<PaginatedResult<StateSummary>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = { level: 'state' };

    if (params.status === 'active' || !params.status) {
      where.isActive = true;
    } else if (params.status === 'inactive') {
      where.isActive = false;
    }

    if (params.search) {
      where.OR = [
        { nameHi: { contains: params.search, mode: 'insensitive' } },
        { nameEn: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.geoLocation.count({ where }),
      this.prisma.geoLocation.findMany({
        where,
        orderBy: { displayOrder: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { children: true },
          },
        },
      }),
    ]);

    return {
      items: items.map((s) => ({
        id: s.id,
        nameHi: s.nameHi,
        nameEn: s.nameEn,
        slug: s.slug,
        stateCode: s.stateCode,
        displayOrder: s.displayOrder,
        isActive: s.isActive,
        divisionsCount: s._count.children,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async findStateByIdOrSlug(idOrSlug: string): Promise<GeoLocationEntity | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const where = isUuid ? { id: idOrSlug, level: 'state' } : { slug: idOrSlug, level: 'state' };

    const state = await this.prisma.geoLocation.findFirst({
      where,
      include: {
        children: {
          where: { level: 'division' },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return (state as GeoLocationEntity) || null;
  }

  public async findDivisions(params: DivisionFilterParams): Promise<PaginatedResult<DivisionSummary>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = { level: 'division' };

    if (params.status === 'active' || !params.status) {
      where.isActive = true;
    } else if (params.status === 'inactive') {
      where.isActive = false;
    }

    if (params.stateId) {
      where.parentId = params.stateId;
    }

    if (params.stateCode) {
      where.stateCode = params.stateCode.toUpperCase();
    }

    if (params.search) {
      where.OR = [
        { nameHi: { contains: params.search, mode: 'insensitive' } },
        { nameEn: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.geoLocation.count({ where }),
      this.prisma.geoLocation.findMany({
        where,
        orderBy: { displayOrder: 'asc' },
        skip,
        take: limit,
        include: {
          children: params.includeDistricts
            ? {
                where: { level: 'district' },
                orderBy: { displayOrder: 'asc' },
              }
            : false,
          _count: {
            select: { children: true },
          },
        },
      }),
    ]);

    return {
      items: items.map((div) => ({
        id: div.id,
        nameHi: div.nameHi,
        nameEn: div.nameEn,
        slug: div.slug,
        stateId: div.parentId,
        stateCode: div.stateCode,
        displayOrder: div.displayOrder,
        isActive: div.isActive,
        districtsCount: div._count.children,
        districts: div.children
          ? div.children.map((dist: any) => ({
              id: dist.id,
              nameHi: dist.nameHi,
              nameEn: dist.nameEn,
              slug: dist.slug,
              divisionId: div.id,
              divisionNameHi: div.nameHi,
              divisionNameEn: div.nameEn,
              stateCode: dist.stateCode,
              displayOrder: dist.displayOrder,
              isActive: dist.isActive,
            }))
          : undefined,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async findDivisionByIdOrSlug(
    idOrSlug: string,
    includeDistricts: boolean = true
  ): Promise<GeoLocationEntity | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const where = isUuid ? { id: idOrSlug, level: 'division' } : { slug: idOrSlug, level: 'division' };

    const division = await this.prisma.geoLocation.findFirst({
      where,
      include: {
        parent: true,
        children: includeDistricts
          ? {
              where: { level: 'district' },
              orderBy: { displayOrder: 'asc' },
            }
          : false,
      },
    });

    return (division as GeoLocationEntity) || null;
  }

  public async findDistricts(params: DistrictFilterParams): Promise<PaginatedResult<DistrictSummary>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 100));
    const skip = (page - 1) * limit;

    const where: any = { level: 'district' };

    if (params.status === 'active' || !params.status) {
      where.isActive = true;
    } else if (params.status === 'inactive') {
      where.isActive = false;
    }

    if (params.divisionId) {
      where.parentId = params.divisionId;
    }

    if (params.stateCode) {
      where.stateCode = params.stateCode.toUpperCase();
    }

    if (params.search) {
      where.OR = [
        { nameHi: { contains: params.search, mode: 'insensitive' } },
        { nameEn: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    const sortField = params.sortBy || 'displayOrder';
    const sortDir = params.sortOrder || 'asc';
    orderBy[sortField] = sortDir;

    const [total, items] = await Promise.all([
      this.prisma.geoLocation.count({ where }),
      this.prisma.geoLocation.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          parent: {
            select: { id: true, nameHi: true, nameEn: true, slug: true },
          },
        },
      }),
    ]);

    return {
      items: items.map((dist) => ({
        id: dist.id,
        nameHi: dist.nameHi,
        nameEn: dist.nameEn,
        slug: dist.slug,
        divisionId: dist.parentId,
        divisionNameHi: dist.parent?.nameHi,
        divisionNameEn: dist.parent?.nameEn,
        stateCode: dist.stateCode,
        displayOrder: dist.displayOrder,
        isActive: dist.isActive,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async findDistrictByIdOrSlug(idOrSlug: string): Promise<GeoLocationEntity | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const where = isUuid ? { id: idOrSlug, level: 'district' } : { slug: idOrSlug, level: 'district' };

    const district = await this.prisma.geoLocation.findFirst({
      where,
      include: {
        parent: {
          include: {
            parent: true,
          },
        },
      },
    });

    return (district as GeoLocationEntity) || null;
  }

  public async findReporterAssignments(reporterId: string): Promise<ReporterTerritoryAssignmentEntity[]> {
    const assignments = await this.prisma.reporterTerritoryAssignment.findMany({
      where: {
        reporterId,
        status: 'active',
      },
      include: {
        location: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return assignments as ReporterTerritoryAssignmentEntity[];
  }
}

/**
 * In-Memory Master Geographic Registry Repository
 * Pre-seeded with 1 State (Madhya Pradesh), exactly 10 Divisions, and 55 Districts.
 * Provides offline execution and isolated automated unit testing.
 */
export class InMemoryTerritoryRepository implements ITerritoryRepository {
  private locations: Map<string, GeoLocationEntity> = new Map();
  private assignments: Map<string, ReporterTerritoryAssignmentEntity> = new Map();

  constructor() {
    this.seedCanonicalMadhyaPradesh();
  }

  public seedCanonicalMadhyaPradesh(): void {
    this.locations.clear();

    const stateId = '00000000-0000-0000-0000-000000000001';
    const state: GeoLocationEntity = {
      id: stateId,
      nameHi: 'मध्य प्रदेश',
      nameEn: 'Madhya Pradesh',
      slug: 'madhya-pradesh',
      level: 'state',
      parentId: null,
      stateCode: 'MP',
      displayOrder: 1,
      isActive: true,
      children: [],
    };
    this.locations.set(stateId, state);

    for (const div of MP_DIVISIONS_AND_DISTRICTS) {
      const divId = `div-${div.slug}`;
      const division: GeoLocationEntity = {
        id: divId,
        nameHi: div.nameHi,
        nameEn: div.nameEn,
        slug: div.slug,
        level: 'division',
        parentId: stateId,
        stateCode: 'MP',
        displayOrder: div.displayOrder,
        isActive: true,
        parent: state,
        children: [],
      };
      this.locations.set(divId, division);
      state.children!.push(division);

      for (const dist of div.districts) {
        const distId = `dist-${dist.slug}`;
        const district: GeoLocationEntity = {
          id: distId,
          nameHi: dist.nameHi,
          nameEn: dist.nameEn,
          slug: dist.slug,
          level: 'district',
          parentId: divId,
          stateCode: 'MP',
          displayOrder: dist.displayOrder,
          isActive: true,
          parent: division,
        };
        this.locations.set(distId, district);
        division.children!.push(district);
      }
    }
  }

  public async getOverview(): Promise<GeographicOverview> {
    const state = Array.from(this.locations.values()).find((l) => l.level === 'state')!;
    const divisions = Array.from(this.locations.values())
      .filter((l) => l.level === 'division' && l.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const totalDistricts = Array.from(this.locations.values()).filter(
      (l) => l.level === 'district' && l.isActive
    ).length;

    return {
      totalStates: 1,
      totalDivisions: divisions.length,
      totalDistricts,
      primaryState: {
        id: state.id,
        nameHi: state.nameHi,
        nameEn: state.nameEn,
        slug: state.slug,
        stateCode: state.stateCode || 'MP',
      },
      divisions: divisions.map((div) => {
        const childDists = (div.children || [])
          .filter((d) => d.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder);

        return {
          id: div.id,
          nameHi: div.nameHi,
          nameEn: div.nameEn,
          slug: div.slug,
          displayOrder: div.displayOrder,
          districtsCount: childDists.length,
          districts: childDists.map((d) => ({
            id: d.id,
            nameHi: d.nameHi,
            nameEn: d.nameEn,
            slug: d.slug,
            divisionId: div.id,
            divisionNameHi: div.nameHi,
            divisionNameEn: div.nameEn,
            stateCode: d.stateCode,
            displayOrder: d.displayOrder,
            isActive: d.isActive,
          })),
        };
      }),
    };
  }

  public async findStates(params: StateFilterParams): Promise<PaginatedResult<StateSummary>> {
    let states = Array.from(this.locations.values()).filter((l) => l.level === 'state');

    if (params.status === 'active' || !params.status) {
      states = states.filter((s) => s.isActive);
    } else if (params.status === 'inactive') {
      states = states.filter((s) => !s.isActive);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      states = states.filter(
        (s) =>
          s.nameHi.toLowerCase().includes(q) ||
          s.nameEn.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q)
      );
    }

    const total = states.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const start = (page - 1) * limit;
    const paged = states.slice(start, start + limit);

    return {
      items: paged.map((s) => ({
        id: s.id,
        nameHi: s.nameHi,
        nameEn: s.nameEn,
        slug: s.slug,
        stateCode: s.stateCode,
        displayOrder: s.displayOrder,
        isActive: s.isActive,
        divisionsCount: s.children?.length || 0,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async findStateByIdOrSlug(idOrSlug: string): Promise<GeoLocationEntity | null> {
    for (const loc of this.locations.values()) {
      if (loc.level === 'state' && (loc.id === idOrSlug || loc.slug === idOrSlug)) {
        return {
          id: loc.id,
          nameHi: loc.nameHi,
          nameEn: loc.nameEn,
          slug: loc.slug,
          level: loc.level,
          parentId: loc.parentId,
          stateCode: loc.stateCode,
          displayOrder: loc.displayOrder,
          isActive: loc.isActive,
          children: (loc.children || []).map((c) => ({
            id: c.id,
            nameHi: c.nameHi,
            nameEn: c.nameEn,
            slug: c.slug,
            level: c.level,
            parentId: c.parentId,
            stateCode: c.stateCode,
            displayOrder: c.displayOrder,
            isActive: c.isActive,
          })),
        };
      }
    }
    return null;
  }

  public async findDivisions(params: DivisionFilterParams): Promise<PaginatedResult<DivisionSummary>> {
    let divisions = Array.from(this.locations.values()).filter((l) => l.level === 'division');

    if (params.status === 'active' || !params.status) {
      divisions = divisions.filter((d) => d.isActive);
    } else if (params.status === 'inactive') {
      divisions = divisions.filter((d) => !d.isActive);
    }

    if (params.stateId) {
      divisions = divisions.filter((d) => d.parentId === params.stateId);
    }

    if (params.stateCode) {
      divisions = divisions.filter((d) => d.stateCode === params.stateCode?.toUpperCase());
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      divisions = divisions.filter(
        (d) =>
          d.nameHi.toLowerCase().includes(q) ||
          d.nameEn.toLowerCase().includes(q) ||
          d.slug.toLowerCase().includes(q)
      );
    }

    divisions.sort((a, b) => a.displayOrder - b.displayOrder);

    const total = divisions.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const start = (page - 1) * limit;
    const paged = divisions.slice(start, start + limit);

    return {
      items: paged.map((div) => {
        const childDists = (div.children || []).filter((d) => d.isActive);
        return {
          id: div.id,
          nameHi: div.nameHi,
          nameEn: div.nameEn,
          slug: div.slug,
          stateId: div.parentId,
          stateCode: div.stateCode,
          displayOrder: div.displayOrder,
          isActive: div.isActive,
          districtsCount: childDists.length,
          districts: params.includeDistricts
            ? childDists.map((d) => ({
                id: d.id,
                nameHi: d.nameHi,
                nameEn: d.nameEn,
                slug: d.slug,
                divisionId: div.id,
                divisionNameHi: div.nameHi,
                divisionNameEn: div.nameEn,
                stateCode: d.stateCode,
                displayOrder: d.displayOrder,
                isActive: d.isActive,
              }))
            : undefined,
        };
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async findDivisionByIdOrSlug(
    idOrSlug: string,
    includeDistricts: boolean = true
  ): Promise<GeoLocationEntity | null> {
    for (const loc of this.locations.values()) {
      if (loc.level === 'division' && (loc.id === idOrSlug || loc.slug === idOrSlug)) {
        const parentState = loc.parentId ? this.locations.get(loc.parentId) : undefined;
        return {
          id: loc.id,
          nameHi: loc.nameHi,
          nameEn: loc.nameEn,
          slug: loc.slug,
          level: loc.level,
          parentId: loc.parentId,
          stateCode: loc.stateCode,
          displayOrder: loc.displayOrder,
          isActive: loc.isActive,
          parent: parentState
            ? {
                id: parentState.id,
                nameHi: parentState.nameHi,
                nameEn: parentState.nameEn,
                slug: parentState.slug,
                level: parentState.level,
                parentId: parentState.parentId,
                stateCode: parentState.stateCode,
                displayOrder: parentState.displayOrder,
                isActive: parentState.isActive,
              }
            : null,
          children: includeDistricts
            ? (loc.children || []).map((c) => ({
                id: c.id,
                nameHi: c.nameHi,
                nameEn: c.nameEn,
                slug: c.slug,
                level: c.level,
                parentId: c.parentId,
                stateCode: c.stateCode,
                displayOrder: c.displayOrder,
                isActive: c.isActive,
              }))
            : [],
        };
      }
    }
    return null;
  }

  public async findDistricts(params: DistrictFilterParams): Promise<PaginatedResult<DistrictSummary>> {
    let districts = Array.from(this.locations.values()).filter((l) => l.level === 'district');

    if (params.status === 'active' || !params.status) {
      districts = districts.filter((d) => d.isActive);
    } else if (params.status === 'inactive') {
      districts = districts.filter((d) => !d.isActive);
    }

    if (params.divisionId) {
      districts = districts.filter((d) => d.parentId === params.divisionId);
    }

    if (params.divisionSlug) {
      const div = Array.from(this.locations.values()).find(
        (l) => l.level === 'division' && l.slug === params.divisionSlug
      );
      if (div) {
        districts = districts.filter((d) => d.parentId === div.id);
      } else {
        districts = [];
      }
    }

    if (params.stateCode) {
      districts = districts.filter((d) => d.stateCode === params.stateCode?.toUpperCase());
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      districts = districts.filter(
        (d) =>
          d.nameHi.toLowerCase().includes(q) ||
          d.nameEn.toLowerCase().includes(q) ||
          d.slug.toLowerCase().includes(q)
      );
    }

    const sortField = params.sortBy || 'displayOrder';
    const sortDir = params.sortOrder === 'desc' ? -1 : 1;

    districts.sort((a: any, b: any) => {
      if (sortField === 'nameEn') return a.nameEn.localeCompare(b.nameEn) * sortDir;
      if (sortField === 'nameHi') return a.nameHi.localeCompare(b.nameHi) * sortDir;
      return (a.displayOrder - b.displayOrder) * sortDir;
    });

    const total = districts.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 100));
    const start = (page - 1) * limit;
    const paged = districts.slice(start, start + limit);

    return {
      items: paged.map((dist) => {
        const div = dist.parentId ? this.locations.get(dist.parentId) : undefined;
        return {
          id: dist.id,
          nameHi: dist.nameHi,
          nameEn: dist.nameEn,
          slug: dist.slug,
          divisionId: dist.parentId,
          divisionNameHi: div?.nameHi,
          divisionNameEn: div?.nameEn,
          stateCode: dist.stateCode,
          displayOrder: dist.displayOrder,
          isActive: dist.isActive,
        };
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async findDistrictByIdOrSlug(idOrSlug: string): Promise<GeoLocationEntity | null> {
    for (const loc of this.locations.values()) {
      if (loc.level === 'district' && (loc.id === idOrSlug || loc.slug === idOrSlug)) {
        const parentDiv = loc.parentId ? this.locations.get(loc.parentId) : undefined;
        const parentState = parentDiv?.parentId ? this.locations.get(parentDiv.parentId) : undefined;
        return {
          id: loc.id,
          nameHi: loc.nameHi,
          nameEn: loc.nameEn,
          slug: loc.slug,
          level: loc.level,
          parentId: loc.parentId,
          stateCode: loc.stateCode,
          displayOrder: loc.displayOrder,
          isActive: loc.isActive,
          parent: parentDiv
            ? {
                id: parentDiv.id,
                nameHi: parentDiv.nameHi,
                nameEn: parentDiv.nameEn,
                slug: parentDiv.slug,
                level: parentDiv.level,
                parentId: parentDiv.parentId,
                stateCode: parentDiv.stateCode,
                displayOrder: parentDiv.displayOrder,
                isActive: parentDiv.isActive,
                parent: parentState
                  ? {
                      id: parentState.id,
                      nameHi: parentState.nameHi,
                      nameEn: parentState.nameEn,
                      slug: parentState.slug,
                      level: parentState.level,
                      parentId: parentState.parentId,
                      stateCode: parentState.stateCode,
                      displayOrder: parentState.displayOrder,
                      isActive: parentState.isActive,
                    }
                  : null,
              }
            : null,
        };
      }
    }
    return null;
  }

  public async findReporterAssignments(reporterId: string): Promise<ReporterTerritoryAssignmentEntity[]> {
    const list: ReporterTerritoryAssignmentEntity[] = [];
    for (const a of this.assignments.values()) {
      if (a.reporterId === reporterId && a.status === 'active') {
        const loc = this.locations.get(a.locationId);
        list.push({
          ...a,
          location: loc,
        });
      }
    }
    return list;
  }

  public addMockAssignment(assignment: ReporterTerritoryAssignmentEntity): void {
    this.assignments.set(assignment.id, assignment);
  }
}

let repositoryInstance: ITerritoryRepository | null = null;

export function getTerritoryRepository(): ITerritoryRepository {
  if (!repositoryInstance) {
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      repositoryInstance = new InMemoryTerritoryRepository();
    } else {
      repositoryInstance = new PrismaTerritoryRepository();
    }
  }
  return repositoryInstance;
}

export const territoryRepository = getTerritoryRepository();
