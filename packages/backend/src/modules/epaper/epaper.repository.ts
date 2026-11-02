/**
 * BREAKING NEWS WALA — E-Paper Repository Boundary
 * Grounded in docs/12-Database.md (DOM-T: epaper_editions, epaper_pages) and docs/02-Features.md (FEAT-FUT-004).
 */

import { getPrismaClient } from '../../db/client';
import {
  EpaperEditionItem,
  EpaperPageItem,
  CreateEpaperEditionDto,
  EpaperArchiveFilter,
  EpaperEditionStatus,
} from './types';

export interface IEpaperRepository {
  findPublishedEditions(filter: EpaperArchiveFilter): Promise<{ editions: EpaperEditionItem[]; total: number }>;
  findAllEditions(filter: EpaperArchiveFilter & { status?: EpaperEditionStatus }): Promise<{ editions: EpaperEditionItem[]; total: number }>;
  findById(id: string): Promise<EpaperEditionItem | null>;
  findByEditionCode(editionCode: string): Promise<EpaperEditionItem | null>;
  createEdition(data: CreateEpaperEditionDto & { createdBy: string; status?: EpaperEditionStatus; pages?: EpaperPageItem[] }): Promise<EpaperEditionItem>;
  updateEdition(id: string, data: Partial<EpaperEditionItem>): Promise<EpaperEditionItem | null>;
  addPage(editionId: string, page: Omit<EpaperPageItem, 'id' | 'editionId' | 'createdAt'>): Promise<EpaperPageItem>;
  incrementViewCount(id: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
  deleteEdition(id: string): Promise<boolean>;
}

export class PrismaEpaperRepository implements IEpaperRepository {
  private get prisma() {
    return getPrismaClient();
  }

  private mapEdition(record: any): EpaperEditionItem {
    return {
      id: record.id,
      editionCode: record.editionCode,
      title: record.title,
      editionDate: record.editionDate instanceof Date ? record.editionDate.toISOString().slice(0, 10) : String(record.editionDate).slice(0, 10),
      editionType: record.editionType,
      language: record.language,
      districtId: record.districtId || undefined,
      status: record.status,
      pageCount: record.pageCount,
      coverImageUrl: record.coverImageUrl || undefined,
      pdfAssetUrl: record.pdfAssetUrl || undefined,
      pdfFileSize: Number(record.pdfFileSize || 0),
      pdfSha256: record.pdfSha256 || undefined,
      scheduledAt: record.scheduledAt ? record.scheduledAt.toISOString() : undefined,
      publishedAt: record.publishedAt ? record.publishedAt.toISOString() : undefined,
      createdBy: record.createdBy,
      approvedBy: record.approvedBy || undefined,
      isPublic: record.isPublic,
      isArchived: record.isArchived,
      viewCount: Number(record.viewCount || 0),
      downloadCount: Number(record.downloadCount || 0),
      pages: record.pages ? record.pages.map((p: any) => ({
        id: p.id,
        editionId: p.editionId,
        pageNumber: p.pageNumber,
        pageTitle: p.pageTitle || undefined,
        imageUrl: p.imageUrl,
        thumbnailImageUrl: p.thumbnailImageUrl || undefined,
        width: p.width,
        height: p.height,
        createdAt: p.createdAt.toISOString(),
      })) : undefined,
      metadata: record.metadata ? (record.metadata as Record<string, any>) : undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  public async findPublishedEditions(filter: EpaperArchiveFilter): Promise<{ editions: EpaperEditionItem[]; total: number }> {
    const where: any = {
      status: 'PUBLISHED',
      isPublic: true,
    };

    if (filter.date) {
      const parsedDate = new Date(filter.date);
      where.editionDate = parsedDate;
    }

    if (filter.districtId) {
      where.districtId = filter.districtId;
    }

    if (filter.editionType) {
      where.editionType = filter.editionType;
    }

    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 10;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.epaperEdition.findMany({
        where,
        include: { pages: { orderBy: { pageNumber: 'asc' } } },
        orderBy: [{ editionDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.epaperEdition.count({ where }),
    ]);

    return {
      editions: records.map((r: any) => this.mapEdition(r)),
      total,
    };
  }

  public async findAllEditions(filter: EpaperArchiveFilter & { status?: EpaperEditionStatus }): Promise<{ editions: EpaperEditionItem[]; total: number }> {
    const where: any = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.date) {
      where.editionDate = new Date(filter.date);
    }

    if (filter.districtId) {
      where.districtId = filter.districtId;
    }

    if (filter.editionType) {
      where.editionType = filter.editionType;
    }

    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.epaperEdition.findMany({
        where,
        include: { pages: { orderBy: { pageNumber: 'asc' } } },
        orderBy: [{ editionDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.epaperEdition.count({ where }),
    ]);

    return {
      editions: records.map((r: any) => this.mapEdition(r)),
      total,
    };
  }

  public async findById(id: string): Promise<EpaperEditionItem | null> {
    const record = await this.prisma.epaperEdition.findUnique({
      where: { id },
      include: { pages: { orderBy: { pageNumber: 'asc' } } },
    });
    return record ? this.mapEdition(record) : null;
  }

  public async findByEditionCode(editionCode: string): Promise<EpaperEditionItem | null> {
    const record = await this.prisma.epaperEdition.findUnique({
      where: { editionCode },
      include: { pages: { orderBy: { pageNumber: 'asc' } } },
    });
    return record ? this.mapEdition(record) : null;
  }

  public async createEdition(
    data: CreateEpaperEditionDto & { createdBy: string; status?: EpaperEditionStatus; pages?: EpaperPageItem[] }
  ): Promise<EpaperEditionItem> {
    const record = await this.prisma.epaperEdition.create({
      data: {
        editionCode: data.editionCode,
        title: data.title,
        editionDate: new Date(data.editionDate),
        editionType: data.editionType || 'DAILY',
        language: data.language || 'hi',
        districtId: data.districtId,
        status: data.status || 'DRAFT',
        pageCount: data.pageCount || (data.pages ? data.pages.length : 0),
        coverImageUrl: data.coverImageUrl,
        pdfAssetUrl: data.pdfAssetUrl,
        pdfFileSize: BigInt(data.pdfFileSize || 0),
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        createdBy: data.createdBy,
        pages: data.pages && data.pages.length > 0 ? {
          create: data.pages.map((p, idx) => ({
            pageNumber: p.pageNumber || idx + 1,
            pageTitle: p.pageTitle,
            imageUrl: p.imageUrl,
            thumbnailImageUrl: p.thumbnailImageUrl,
            width: p.width || 1240,
            height: p.height || 1754,
          })),
        } : undefined,
      },
      include: { pages: { orderBy: { pageNumber: 'asc' } } },
    });

    return this.mapEdition(record);
  }

  public async updateEdition(id: string, data: Partial<EpaperEditionItem>): Promise<EpaperEditionItem | null> {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.editionType !== undefined) updateData.editionType = data.editionType;
    if (data.districtId !== undefined) updateData.districtId = data.districtId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
    if (data.pdfAssetUrl !== undefined) updateData.pdfAssetUrl = data.pdfAssetUrl;
    if (data.pdfFileSize !== undefined) updateData.pdfFileSize = BigInt(data.pdfFileSize);
    if (data.pdfSha256 !== undefined) updateData.pdfSha256 = data.pdfSha256;
    if (data.pageCount !== undefined) updateData.pageCount = data.pageCount;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

    const record = await this.prisma.epaperEdition.update({
      where: { id },
      data: updateData,
      include: { pages: { orderBy: { pageNumber: 'asc' } } },
    });

    return this.mapEdition(record);
  }

  public async addPage(
    editionId: string,
    page: Omit<EpaperPageItem, 'id' | 'editionId' | 'createdAt'>
  ): Promise<EpaperPageItem> {
    const record = await this.prisma.epaperPage.create({
      data: {
        editionId,
        pageNumber: page.pageNumber,
        pageTitle: page.pageTitle,
        imageUrl: page.imageUrl,
        thumbnailImageUrl: page.thumbnailImageUrl,
        width: page.width || 1240,
        height: page.height || 1754,
      },
    });

    // Update pageCount in parent edition
    await this.prisma.epaperEdition.update({
      where: { id: editionId },
      data: {
        pageCount: {
          increment: 1,
        },
      },
    });

    return {
      id: record.id,
      editionId: record.editionId,
      pageNumber: record.pageNumber,
      pageTitle: record.pageTitle || undefined,
      imageUrl: record.imageUrl,
      thumbnailImageUrl: record.thumbnailImageUrl || undefined,
      width: record.width,
      height: record.height,
      createdAt: record.createdAt.toISOString(),
    };
  }

  public async incrementViewCount(id: string): Promise<void> {
    await this.prisma.epaperEdition.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  public async incrementDownloadCount(id: string): Promise<void> {
    await this.prisma.epaperEdition.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  }

  public async deleteEdition(id: string): Promise<boolean> {
    try {
      await this.prisma.epaperEdition.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * In-Memory E-Paper Repository for testing and environments without an active PostgreSQL socket.
 * Pre-seeded with authentic Madhya Pradesh regional editions.
 */
export class InMemoryEpaperRepository implements IEpaperRepository {
  private editions: Map<string, EpaperEditionItem> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const now = new Date().toISOString();
    const today = new Date().toISOString().slice(0, 10);

    const bplPages: EpaperPageItem[] = Array.from({ length: 8 }, (_, i) => ({
      id: `page-bpl-${i + 1}`,
      editionId: 'epaper-bpl-001',
      pageNumber: i + 1,
      pageTitle: i === 0 ? 'प्रथम पृष्ठ — मुख्य समाचार' : i === 1 ? 'भोपाल नगर एवं मेट्रो' : i === 2 ? 'मध्य प्रदेश प्रादेशिक' : i === 3 ? 'संपादकीय एवं विचार' : i === 4 ? 'व्यापार व उद्योग' : i === 5 ? 'खेल जगत' : i === 6 ? 'सिनेमा व जीवन शैली' : 'अंतिम पृष्ठ — देश-विदेश',
      imageUrl: `/assets/epaper/mock/bhopal-page-${i + 1}.webp`,
      thumbnailImageUrl: `/assets/epaper/mock/bhopal-page-${i + 1}-thumb.webp`,
      width: 1240,
      height: 1754,
      createdAt: now,
    }));

    const indPages: EpaperPageItem[] = Array.from({ length: 6 }, (_, i) => ({
      id: `page-ind-${i + 1}`,
      editionId: 'epaper-ind-002',
      pageNumber: i + 1,
      pageTitle: i === 0 ? 'प्रथम पृष्ठ — इंदौर लाइव' : i === 1 ? 'मालवा-निमाड़ डायरी' : i === 2 ? 'व्यापारिक राजधानी' : i === 3 ? 'संपादकीय' : i === 4 ? 'खेल व युवा' : 'देश व दुनिया',
      imageUrl: `/assets/epaper/mock/indore-page-${i + 1}.webp`,
      thumbnailImageUrl: `/assets/epaper/mock/indore-page-${i + 1}-thumb.webp`,
      width: 1240,
      height: 1754,
      createdAt: now,
    }));

    const ujjPages: EpaperPageItem[] = Array.from({ length: 4 }, (_, i) => ({
      id: `page-ujj-${i + 1}`,
      editionId: 'epaper-ujj-003',
      pageNumber: i + 1,
      pageTitle: i === 0 ? 'महाकाल नगरी विशेष' : i === 1 ? 'धार्मिक व सांस्कृतिक समाचार' : i === 2 ? 'उज्जैन जिला दर्शन' : 'संपादकीय व संदेश',
      imageUrl: `/assets/epaper/mock/ujjain-page-${i + 1}.webp`,
      thumbnailImageUrl: `/assets/epaper/mock/ujjain-page-${i + 1}-thumb.webp`,
      width: 1240,
      height: 1754,
      createdAt: now,
    }));

    const gwlPages: EpaperPageItem[] = Array.from({ length: 6 }, (_, i) => ({
      id: `page-gwl-${i + 1}`,
      editionId: 'epaper-gwl-004',
      pageNumber: i + 1,
      pageTitle: i === 0 ? 'ग्वालियर-चंबल प्रभात' : i === 1 ? 'किला अंचल' : i === 2 ? 'मुरैना-भिंड हलचल' : i === 3 ? 'संपादकीय' : i === 4 ? 'शिक्षा व रोजगार' : 'राष्ट्रीय सार',
      imageUrl: `/assets/epaper/mock/gwalior-page-${i + 1}.webp`,
      thumbnailImageUrl: `/assets/epaper/mock/gwalior-page-${i + 1}-thumb.webp`,
      width: 1240,
      height: 1754,
      createdAt: now,
    }));

    const jblPages: EpaperPageItem[] = Array.from({ length: 4 }, (_, i) => ({
      id: `page-jbl-${i + 1}`,
      editionId: 'epaper-jbl-005',
      pageNumber: i + 1,
      pageTitle: i === 0 ? 'जबलपुर महाकौशल' : i === 1 ? 'संस्कारधानी समाचार' : i === 2 ? 'नर्मदा अंचल' : 'विचार मंच',
      imageUrl: `/assets/epaper/mock/jabalpur-page-${i + 1}.webp`,
      thumbnailImageUrl: `/assets/epaper/mock/jabalpur-page-${i + 1}-thumb.webp`,
      width: 1240,
      height: 1754,
      createdAt: now,
    }));

    const items: EpaperEditionItem[] = [
      {
        id: 'epaper-bpl-001',
        editionCode: 'EP-BPL-20261101',
        title: 'भोपाल मुख्य संस्करण — 01 नवम्बर 2026',
        editionDate: today,
        editionType: 'DAILY',
        language: 'hi',
        districtId: 'bhopal',
        status: 'PUBLISHED',
        pageCount: 8,
        coverImageUrl: '/assets/epaper/mock/bhopal-cover.webp',
        pdfAssetUrl: '/assets/epaper/mock/bhopal-20261101.pdf',
        pdfFileSize: 8421376, // ~8 MB
        pdfSha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        publishedAt: now,
        createdBy: 'usr-admin-001',
        approvedBy: 'usr-editor-bhopal-01',
        isPublic: true,
        isArchived: false,
        viewCount: 1420,
        downloadCount: 380,
        pages: bplPages,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'epaper-ind-002',
        editionCode: 'EP-IND-20261101',
        title: 'इंदौर मालवा-निमाड़ संस्करण — 01 नवम्बर 2026',
        editionDate: today,
        editionType: 'DAILY',
        language: 'hi',
        districtId: 'indore',
        status: 'PUBLISHED',
        pageCount: 6,
        coverImageUrl: '/assets/epaper/mock/indore-cover.webp',
        pdfAssetUrl: '/assets/epaper/mock/indore-20261101.pdf',
        pdfFileSize: 6512340,
        pdfSha256: '8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c',
        publishedAt: now,
        createdBy: 'usr-admin-001',
        approvedBy: 'usr-editor-indore-01',
        isPublic: true,
        isArchived: false,
        viewCount: 1180,
        downloadCount: 290,
        pages: indPages,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'epaper-ujj-003',
        editionCode: 'EP-UJJ-20261101',
        title: 'उज्जैन महाकाल विशेष संस्करण — 01 नवम्बर 2026',
        editionDate: today,
        editionType: 'SPECIAL',
        language: 'hi',
        districtId: 'ujjain',
        status: 'PUBLISHED',
        pageCount: 4,
        coverImageUrl: '/assets/epaper/mock/ujjain-cover.webp',
        pdfAssetUrl: '/assets/epaper/mock/ujjain-20261101.pdf',
        pdfFileSize: 4194304,
        publishedAt: now,
        createdBy: 'usr-admin-001',
        approvedBy: 'usr-editor-bhopal-01',
        isPublic: true,
        isArchived: false,
        viewCount: 950,
        downloadCount: 180,
        pages: ujjPages,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'epaper-gwl-004',
        editionCode: 'EP-GWL-20261101',
        title: 'ग्वालियर-चंबल प्रभात संस्करण — 01 नवम्बर 2026',
        editionDate: today,
        editionType: 'DAILY',
        language: 'hi',
        districtId: 'gwalior',
        status: 'PUBLISHED',
        pageCount: 6,
        coverImageUrl: '/assets/epaper/mock/gwalior-cover.webp',
        pdfAssetUrl: '/assets/epaper/mock/gwalior-20261101.pdf',
        pdfFileSize: 5800000,
        publishedAt: now,
        createdBy: 'usr-admin-001',
        approvedBy: 'usr-editor-bhopal-01',
        isPublic: true,
        isArchived: false,
        viewCount: 640,
        downloadCount: 110,
        pages: gwlPages,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'epaper-jbl-005',
        editionCode: 'EP-JBL-20261102',
        title: 'जबलपुर महाकौशल संस्करण — 02 नवम्बर 2026',
        editionDate: '2026-11-02',
        editionType: 'DAILY',
        language: 'hi',
        districtId: 'jabalpur',
        status: 'PENDING_REVIEW',
        pageCount: 4,
        coverImageUrl: '/assets/epaper/mock/jabalpur-cover.webp',
        pdfAssetUrl: '/assets/epaper/mock/jabalpur-20261102.pdf',
        pdfFileSize: 4300000,
        createdBy: 'usr-admin-001',
        isPublic: false,
        isArchived: false,
        viewCount: 0,
        downloadCount: 0,
        pages: jblPages,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'epaper-draft-006',
        editionCode: 'EP-DRAFT-001',
        title: 'विशेष चुनावी बुलेटिन ड्राफ्ट',
        editionDate: today,
        editionType: 'SPECIAL',
        language: 'hi',
        districtId: 'bhopal',
        status: 'DRAFT',
        pageCount: 2,
        pdfFileSize: 0,
        createdBy: 'usr-admin-001',
        isPublic: false,
        isArchived: false,
        viewCount: 0,
        downloadCount: 0,
        pages: [],
        createdAt: now,
        updatedAt: now,
      },
    ];

    items.forEach((item) => {
      this.editions.set(item.id, item);
    });
  }

  public async findPublishedEditions(filter: EpaperArchiveFilter): Promise<{ editions: EpaperEditionItem[]; total: number }> {
    let list = Array.from(this.editions.values()).filter(
      (e) => e.status === 'PUBLISHED' && e.isPublic
    );

    if (filter.date) {
      list = list.filter((e) => e.editionDate === filter.date);
    }
    if (filter.districtId) {
      list = list.filter((e) => e.districtId === filter.districtId);
    }
    if (filter.editionType) {
      list = list.filter((e) => e.editionType === filter.editionType);
    }

    list.sort((a, b) => b.editionDate.localeCompare(a.editionDate));

    const total = list.length;
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 10;
    const start = (page - 1) * limit;
    const paged = list.slice(start, start + limit);

    return { editions: paged, total };
  }

  public async findAllEditions(filter: EpaperArchiveFilter & { status?: EpaperEditionStatus }): Promise<{ editions: EpaperEditionItem[]; total: number }> {
    let list = Array.from(this.editions.values());

    if (filter.status) {
      list = list.filter((e) => e.status === filter.status);
    }
    if (filter.date) {
      list = list.filter((e) => e.editionDate === filter.date);
    }
    if (filter.districtId) {
      list = list.filter((e) => e.districtId === filter.districtId);
    }
    if (filter.editionType) {
      list = list.filter((e) => e.editionType === filter.editionType);
    }

    list.sort((a, b) => b.editionDate.localeCompare(a.editionDate));

    const total = list.length;
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;
    const start = (page - 1) * limit;
    const paged = list.slice(start, start + limit);

    return { editions: paged, total };
  }

  public async findById(id: string): Promise<EpaperEditionItem | null> {
    const item = this.editions.get(id);
    return item ? { ...item, pages: item.pages ? [...item.pages] : [] } : null;
  }

  public async findByEditionCode(editionCode: string): Promise<EpaperEditionItem | null> {
    for (const item of this.editions.values()) {
      if (item.editionCode === editionCode) {
        return { ...item, pages: item.pages ? [...item.pages] : [] };
      }
    }
    return null;
  }

  public async createEdition(
    data: CreateEpaperEditionDto & { createdBy: string; status?: EpaperEditionStatus; pages?: EpaperPageItem[] }
  ): Promise<EpaperEditionItem> {
    const id = `epaper-${Date.now()}`;
    const now = new Date().toISOString();
    const newEdition: EpaperEditionItem = {
      id,
      editionCode: data.editionCode,
      title: data.title,
      editionDate: data.editionDate,
      editionType: data.editionType || 'DAILY',
      language: data.language || 'hi',
      districtId: data.districtId,
      status: data.status || 'DRAFT',
      pageCount: data.pageCount || (data.pages ? data.pages.length : 0),
      coverImageUrl: data.coverImageUrl,
      pdfAssetUrl: data.pdfAssetUrl,
      pdfFileSize: data.pdfFileSize || 0,
      scheduledAt: data.scheduledAt,
      createdBy: data.createdBy,
      isPublic: data.status === 'PUBLISHED',
      isArchived: false,
      viewCount: 0,
      downloadCount: 0,
      pages: data.pages || [],
      createdAt: now,
      updatedAt: now,
    };

    this.editions.set(id, newEdition);
    return { ...newEdition };
  }

  public async updateEdition(id: string, data: Partial<EpaperEditionItem>): Promise<EpaperEditionItem | null> {
    const existing = this.editions.get(id);
    if (!existing) return null;

    const updated: EpaperEditionItem = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (data.status === 'PUBLISHED') {
      updated.isPublic = true;
      if (!updated.publishedAt) {
        updated.publishedAt = new Date().toISOString();
      }
    }

    this.editions.set(id, updated);
    return { ...updated };
  }

  public async addPage(
    editionId: string,
    page: Omit<EpaperPageItem, 'id' | 'editionId' | 'createdAt'>
  ): Promise<EpaperPageItem> {
    const edition = this.editions.get(editionId);
    if (!edition) {
      throw new Error(`Edition ${editionId} not found.`);
    }

    const pageId = `page-${Date.now()}-${page.pageNumber}`;
    const newPage: EpaperPageItem = {
      id: pageId,
      editionId,
      pageNumber: page.pageNumber,
      pageTitle: page.pageTitle,
      imageUrl: page.imageUrl,
      thumbnailImageUrl: page.thumbnailImageUrl,
      width: page.width || 1240,
      height: page.height || 1754,
      createdAt: new Date().toISOString(),
    };

    const pages = edition.pages ? [...edition.pages, newPage] : [newPage];
    edition.pages = pages.sort((a, b) => a.pageNumber - b.pageNumber);
    edition.pageCount = edition.pages.length;
    edition.updatedAt = new Date().toISOString();

    return { ...newPage };
  }

  public async incrementViewCount(id: string): Promise<void> {
    const edition = this.editions.get(id);
    if (edition) {
      edition.viewCount += 1;
    }
  }

  public async incrementDownloadCount(id: string): Promise<void> {
    const edition = this.editions.get(id);
    if (edition) {
      edition.downloadCount += 1;
    }
  }

  public async deleteEdition(id: string): Promise<boolean> {
    return this.editions.delete(id);
  }
}

let epaperRepoInstance: IEpaperRepository | null = null;

export function getEpaperRepository(): IEpaperRepository {
  if (!epaperRepoInstance) {
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      epaperRepoInstance = new InMemoryEpaperRepository();
    } else {
      epaperRepoInstance = new PrismaEpaperRepository();
    }
  }
  return epaperRepoInstance;
}

export function setEpaperRepository(repo: IEpaperRepository): void {
  epaperRepoInstance = repo;
}
