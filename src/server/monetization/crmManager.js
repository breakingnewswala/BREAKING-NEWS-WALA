/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Advertiser & Partner CRM (Proposals, Contracts, Follow-ups & Notes)
 * Grounded in docs/Monetization.md (Section 7)
 */

import crypto from 'node:crypto';

export class CrmManager {
  constructor(adapter) {
    this.adapter = adapter;
    this.init();
  }

  async init() {
    // Seed initial CRM records if empty
    const existingNotes = await this.adapter.getCrmNotes('adv-mp-tourism-001');
    if (!existingNotes || existingNotes.length === 0) {
      await this.adapter.saveCrmNote({
        id: 'crm-note-001',
        advertiserId: 'adv-mp-tourism-001',
        channel: 'meeting',
        summary: 'मांडू एवं खजुराहो शीतकालीन महोत्सव 2026 अभियान पर चर्चा',
        details: 'पर्यटन विकास निगम के साथ मुख्य लीडरबोर्ड एवं प्रायोजित आलेख पैकेज पर सहमति बनी। ₹45,000 का बजट अनुमोदित।',
        followUpDate: '2026-11-20T10:00:00.000Z',
        authorName: 'राजेश खन्ना (कमर्शियल हेड)',
        createdAt: '2026-10-28T14:30:00.000Z',
      });
    }
  }

  async getNotes(advertiserId) {
    return this.adapter.getCrmNotes(advertiserId);
  }

  async addNote(advertiserId, { channel = 'call', summary, details, followUpDate }, user) {
    if (!advertiserId || !summary) {
      throw new Error('advertiserId and summary are required');
    }

    const note = {
      id: `crm-note-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      advertiserId,
      channel, // 'call', 'email', 'meeting', 'whatsapp'
      summary,
      details: details || '',
      followUpDate: followUpDate || null,
      authorName: user?.fullName || 'कमर्शियल एग्जीक्यूटिव',
      createdAt: new Date().toISOString(),
    };

    const saved = await this.adapter.saveCrmNote(note, user);

    this.adapter.addAuditLog(
      user?.fullName || 'स्टाफ',
      'CRM',
      'CRM_NOTE_ADDED',
      `सीआरएम संवाद नोट जोड़ा गया: ${saved.summary} [विज्ञापनदाता: ${advertiserId}]`,
      null
    );

    return saved;
  }

  async getProposals(advertiserId) {
    return this.adapter.getCrmProposals(advertiserId);
  }

  async createProposal({
    advertiserId,
    title,
    amountPaise,
    deliverables = [],
    validUntil,
  }, user) {
    if (!advertiserId || !title || !amountPaise) {
      throw new Error('advertiserId, title, and amountPaise are required');
    }

    const proposalNumber = `PROP-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const proposal = {
      id: `prop-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      proposalNumber,
      advertiserId,
      title,
      amountPaise: Number(amountPaise),
      amountRupees: (Number(amountPaise) / 100).toFixed(2),
      deliverables,
      validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
      status: 'SENT', // DRAFT, SENT, NEGOTIATING, ACCEPTED, DECLINED
      authorName: user?.fullName || 'कमर्शियल हेड',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.adapter.saveCrmProposal(proposal, user);

    this.adapter.addAuditLog(
      user?.fullName || 'स्टाफ',
      'CRM',
      'PROPOSAL_CREATED',
      `नया वाणिज्यिक प्रस्ताव: ${saved.proposalNumber} - "${saved.title}" (₹${saved.amountRupees})`,
      null
    );

    return saved;
  }

  async updateProposalStatus(proposalId, status, user) {
    const prop = await this.adapter.getCrmProposalById(proposalId, user);
    if (!prop) throw new Error('Proposal not found');

    prop.status = status;
    prop.updatedAt = new Date().toISOString();

    const saved = await this.adapter.saveCrmProposal(prop, user);

    this.adapter.addAuditLog(
      user?.fullName || 'स्टाफ',
      'CRM',
      'PROPOSAL_STATUS_CHANGED',
      `प्रस्ताव स्थिति बदली गई: ${prop.proposalNumber} -> ${status}`,
      null
    );

    return saved;
  }
}

