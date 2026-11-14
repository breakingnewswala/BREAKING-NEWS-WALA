/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * WhatsApp Business Platform Service & Compliance Engine
 * Grounded in docs/20-Integrations.md, Indian TRAI & WhatsApp Messaging Policy
 */

import { INTEGRATION_ERROR_CODES } from './constants.js';

export class WhatsAppManager {
  constructor(adapter) {
    this.adapter = adapter;
  }

  async getTemplates(user) {
    return this.adapter.getWhatsAppTemplates(user);
  }

  async getTemplateById(id, user) {
    return this.adapter.getWhatsAppTemplateById(id, user);
  }

  async createTemplate(dto, user) {
    if (!dto.name || !dto.bodyText) {
      throw new Error('Template name and bodyText are required');
    }

    const payload = {
      name: dto.name,
      displayName: dto.displayName || dto.name,
      category: dto.category || 'UTILITY',
      language: dto.language || 'hi',
      approvalStatus: 'PENDING', // Meta approval lifecycle
      headerText: dto.headerText || '',
      bodyText: dto.bodyText,
      footerText: dto.footerText || 'अनसब्सक्राइब करने के लिए STOP लिखकर भेजें।',
      buttons: dto.buttons || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.adapter.saveWhatsAppTemplate(payload, user);
  }

  async getSubscribers(params = {}, user) {
    return this.adapter.getWhatsAppSubscribers(params, user);
  }

  async recordOptIn({ phoneNumber, name = '', district = 'भोपाल', districtId = 'dist-bhopal', consentSource = 'web_portal' }) {
    if (!phoneNumber) throw new Error('Phone number is required for opt-in');

    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const existing = await this.adapter.getWhatsAppSubscriberByPhone(cleanPhone);

    const payload = {
      id: existing ? existing.id : `sub-wa-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      phoneNumber: cleanPhone,
      name: name || existing?.name || 'नागरिक पाठक',
      district: district || existing?.district || 'भोपाल',
      districtId: districtId || existing?.districtId || 'dist-bhopal',
      status: 'ACTIVE',
      optInAt: new Date().toISOString(),
      optOutAt: null,
      consentSource: consentSource || 'web_portal',
    };

    return this.adapter.saveWhatsAppSubscriber(payload);
  }

  async recordOptOut(phoneNumber, reason = 'user_request') {
    if (!phoneNumber) throw new Error('Phone number is required for opt-out');

    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const subscriber = await this.adapter.getWhatsAppSubscriberByPhone(cleanPhone);

    if (!subscriber) {
      // Create opted-out record so no future message is ever sent
      const payload = {
        id: `sub-wa-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        phoneNumber: cleanPhone,
        name: 'अज्ञात',
        district: 'मध्य प्रदेश',
        districtId: 'dist-bhopal',
        status: 'OPTED_OUT',
        optInAt: new Date().toISOString(),
        optOutAt: new Date().toISOString(),
        consentSource: 'direct_opt_out',
        optOutReason: reason,
      };
      return this.adapter.saveWhatsAppSubscriber(payload);
    }

    const updated = {
      ...subscriber,
      status: 'OPTED_OUT',
      optOutAt: new Date().toISOString(),
      optOutReason: reason,
    };

    return this.adapter.saveWhatsAppSubscriber(updated);
  }

  /**
   * Evaluates inbound messages for STOP keywords ("STOP", "UNSUBSCRIBE", "रोकें", "बंद करें")
   */
  async handleInboundMessage({ from, text, messageId }) {
    const cleanFrom = from.replace(/[^0-9+]/g, '');
    const normalizedText = (text || '').trim().toLowerCase();

    const isStopKeyword =
      normalizedText === 'stop' ||
      normalizedText === 'unsubscribe' ||
      normalizedText === 'रोकें' ||
      normalizedText === 'रोको' ||
      normalizedText === 'बंद करें' ||
      normalizedText === 'बंद करो';

    if (isStopKeyword) {
      await this.recordOptOut(cleanFrom, 'inbound_keyword_stop');
      return {
        action: 'OPT_OUT_PROCESSED',
        from: cleanFrom,
        message: 'आपका नंबर सफलतापूर्वक हटा दिया गया है। अब कोई समाचार अलर्ट नहीं भेजा जाएगा।',
      };
    }

    const isStartKeyword =
      normalizedText === 'start' ||
      normalizedText === 'subscribe' ||
      normalizedText === 'शुरू करें' ||
      normalizedText === 'न्यूज़';

    if (isStartKeyword) {
      await this.recordOptIn({ phoneNumber: cleanFrom, consentSource: 'inbound_keyword_start' });
      return {
        action: 'OPT_IN_PROCESSED',
        from: cleanFrom,
        message: 'ब्रेकिंग न्यूज़ वाला में आपका स्वागत है! आपको समाचार अलर्ट मिलना शुरू हो गए हैं।',
      };
    }

    return {
      action: 'INBOUND_RECEIVED',
      from: cleanFrom,
      messageId,
      text,
    };
  }

  async sendTemplateMessage({ templateId, recipientPhone, parameters = [] }, user) {
    const template = await this.adapter.getWhatsAppTemplateById(templateId);
    if (!template) throw new Error('WhatsApp template not found');

    if (template.approvalStatus !== 'APPROVED') {
      throw new Error(`Cannot send unapproved template. Status: ${template.approvalStatus}`);
    }

    const cleanPhone = recipientPhone.replace(/[^0-9+]/g, '');
    const subscriber = await this.adapter.getWhatsAppSubscriberByPhone(cleanPhone);

    // Invariant: NEVER send to opted-out numbers!
    if (subscriber && subscriber.status === 'OPTED_OUT') {
      const err = new Error(`Recipient ${cleanPhone} has OPTED OUT from WhatsApp messages (TRAI/Meta Consent Policy).`);
      err.statusCode = 400;
      err.code = INTEGRATION_ERROR_CODES.ERR_WHATSAPP_OPTED_OUT;
      throw err;
    }

    return {
      success: true,
      recipientPhone: cleanPhone,
      templateId: template.id,
      templateName: template.name,
      messageId: `wamid.HBgL${Date.now()}`,
      status: 'SENT',
      timestamp: new Date().toISOString(),
    };
  }
}

