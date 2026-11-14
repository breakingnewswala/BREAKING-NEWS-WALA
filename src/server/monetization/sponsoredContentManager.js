/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Sponsored Content & Native Editorial Gate Engine
 * Grounded in docs/Monetization.md (Section 9) and docs/06-Business-Rules.md (RULE-AD-002)
 * 
 * Strict Invariants:
 * 1. No Disguised Advertorials: Mandatory ASCI badge "प्रायोजित सामग्री / Sponsored Content".
 * 2. Advertisers Possess Zero CMS Direct Publishing Rights.
 * 3. Editorial Firewall: Chief Editor / Newsroom desk approval mandatory prior to live publication.
 * 4. External links carry rel="sponsored" to prevent SEO penalties.
 */

import crypto from 'node:crypto';
import { ASCI_SPONSORED_LABEL_HI, MONETIZATION_ERROR_CODES } from './constants.js';

export class SponsoredContentManager {
  constructor(adapter) {
    this.adapter = adapter;
    this.init();
  }

  async init() {
    // Seed initial sponsored article if empty
    const existing = await this.adapter.getSponsoredArticles();
    if (!existing || existing.length === 0) {
      const seedSponsored = {
        id: 'spon-mandu-utsav-001',
        title: 'मांडू उत्सव 2026: मध्य प्रदेश पर्यटन का भव्य शीतकालीन सांस्कृतिक महाकुंभ',
        summary: 'मालवा की ऐतिहासिक नगरी मांडू में 24 से 28 दिसंबर तक आयोजित होगा वार्षिक पर्यटन महोत्सव।',
        content: `मध्य प्रदेश राज्य पर्यटन विकास निगम द्वारा आयोजित मांडू उत्सव 2026 इस वर्ष विशेष सांस्कृतिक आयोजनों, हेरिटेज वॉक, हॉट एयर बैलूनिंग और ग्रामीण पाक कला प्रदर्शनों के साथ पर्यटकों का स्वागत करने के लिए तैयार है।\n\nपर्यटन विभाग के अधिकारियों के अनुसार, यह आयोजन मांडू के ऐतिहासिक किलों, रानी रूपमती महल और जहाज महल के गौरवशाली इतिहास को राष्ट्रीय मंच पर प्रस्तुत करता है।`,
        advertiserId: 'adv-mp-tourism-001',
        advertiserName: 'मध्य प्रदेश राज्य पर्यटन विकास निगम (MP Tourism)',
        campaignId: 'cmp-mp-tourism-winter-2026',
        district: 'धार',
        featuredImage: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=1200&auto=format&fit=crop&q=80',
        brandDisclosure: 'मध्य प्रदेश राज्य पर्यटन विकास निगम द्वारा प्रायोजित प्रस्तुति',
        isSponsored: true,
        isEditorialApproved: true,
        approvedBy: 'संपादक मंडल',
        approvedAt: '2026-11-01T12:00:00.000Z',
        status: 'APPROVED', // PENDING_REVIEW, APPROVED, REJECTED, PUBLISHED
        articleId: null,
        metrics: {
          views: 12400,
          avgReadTimeSec: 145,
          shares: 580,
        },
        createdAt: '2026-10-31T10:00:00.000Z',
        updatedAt: '2026-11-14T00:00:00.000Z',
      };
      await this.adapter.saveSponsoredArticle(seedSponsored);
    }
  }

  async listSponsoredArticles({ status, advertiserId } = {}) {
    let list = await this.adapter.getSponsoredArticles();
    if (status) {
      list = list.filter((s) => s.status === status);
    }
    if (advertiserId) {
      list = list.filter((s) => s.advertiserId === advertiserId);
    }
    return list;
  }

  async getSponsoredArticleById(id) {
    return this.adapter.getSponsoredArticleById(id);
  }

  /**
   * Submits a new sponsored article for mandatory editorial review
   */
  async submitSponsoredArticle(dto, user) {
    if (!dto.title || !dto.content || !dto.advertiserId) {
      throw new Error('Title, content, and advertiserId are required');
    }

    const adv = await this.adapter.getAdvertiserById(dto.advertiserId);
    if (!adv) throw new Error('Advertiser not found');

    const sponsored = {
      id: `spon-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      title: dto.title,
      summary: dto.summary || dto.content.slice(0, 150),
      content: dto.content,
      advertiserId: adv.id,
      advertiserName: adv.organizationName,
      campaignId: dto.campaignId || null,
      district: dto.district || 'भोपाल',
      featuredImage: dto.featuredImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
      brandDisclosure: dto.brandDisclosure || `${adv.organizationName} द्वारा प्रायोजित प्रस्तुति`,
      isSponsored: true,
      isEditorialApproved: false, // Mandatory Editorial Firewall: Never auto-approved
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      status: 'PENDING_REVIEW',
      articleId: null,
      metrics: {
        views: 0,
        avgReadTimeSec: 0,
        shares: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.adapter.saveSponsoredArticle(sponsored, user);

    this.adapter.addAuditLog(
      user?.fullName || 'विज्ञापनदाता प्रतिनिधि',
      'SPONSORED_CONTENT',
      'SPONSORED_ARTICLE_SUBMITTED',
      `प्रायोजित आलेख समीक्षा हेतु प्रस्तुत: "${saved.title}" [विज्ञापनदाता: ${saved.advertiserName}]`,
      null
    );

    return saved;
  }

  /**
   * Editorial Review Gate: Only Newsroom Editors / Admins can approve
   */
  async reviewSponsoredArticle(id, { action, reason, targetPublishStatus = 'DRAFT' }, user) {
    const spon = await this.getSponsoredArticleById(id);
    if (!spon) throw new Error('Sponsored article not found');

    if (action === 'approve') {
      spon.isEditorialApproved = true;
      spon.approvedBy = user?.fullName || 'संपादक';
      spon.approvedAt = new Date().toISOString();
      spon.status = 'APPROVED';
      spon.rejectionReason = null;

      // Create linked newsroom article draft with permanent ASCI disclosure
      const disclaimer = `\n\n---\n**अस्वीकरण (Disclaimer):** यह एक प्रायोजित आलेख है। इसमें व्यक्त विचार विज्ञापनदाता के हैं और बीएनडब्ल्यू (BREAKING NEWS WALA) संपादकीय मंडल का इनसे सहमत होना आवश्यक नहीं है। (Sponsored Content)\n`;
      const fullCopy = `${spon.content}${disclaimer}`;

      const draftPayload = {
        title: `[${ASCI_SPONSORED_LABEL_HI}] ${spon.title}`,
        summary: spon.summary,
        content: fullCopy,
        district: spon.district || 'भोपाल',
        category: 'sponsored',
        categoryId: 'cat-mp',
        featuredImage: spon.featuredImage,
        imageAttribution: spon.brandDisclosure,
        isBreaking: false,
        isSponsored: true,
        sourceAttribution: `प्रायोजित: ${spon.advertiserName}`,
        tags: ['प्रायोजित सामग्री', spon.district || 'मध्य प्रदेश', 'विज्ञापन'],
        editorialNotes: `प्रायोजित आलेख [ID: ${spon.id}]. संपादक [${spon.approvedBy}] द्वारा सत्यापित एवं स्वीकृत।`,
      };

      const savedArticle = await this.adapter.createDraft(draftPayload, user);
      spon.articleId = savedArticle.id;
    } else if (action === 'reject') {
      spon.isEditorialApproved = false;
      spon.status = 'REJECTED';
      spon.rejectionReason = reason || 'संपादकीय दिशा-निर्देशों अथवा तथ्यात्मक मानकों के अनुरूप नहीं';
    } else {
      throw new Error('Action must be "approve" or "reject"');
    }

    spon.updatedAt = new Date().toISOString();
    const saved = await this.adapter.saveSponsoredArticle(spon, user);

    this.adapter.addAuditLog(
      user?.fullName || 'संपादक',
      'SPONSORED_CONTENT',
      action === 'approve' ? 'SPONSORED_ARTICLE_APPROVED' : 'SPONSORED_ARTICLE_REJECTED',
      `प्रायोजित सामग्री संपादकीय निर्णय: "${spon.title}" -> ${spon.status}`,
      null
    );

    return saved;
  }
}

