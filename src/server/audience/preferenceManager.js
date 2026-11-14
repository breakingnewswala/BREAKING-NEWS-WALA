/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * User Profile, Preferences & Privacy Governance Manager
 * Implements DPDPA 2023 Data Minimization, Consent Records, and Personalization Controls.
 */

import crypto from 'node:crypto';
import {
  DEFAULT_USER_PREFERENCES,
  AUDIENCE_ERROR_CODES,
  AUDIENCE_LIMITS,
} from './constants.js';

export class PreferenceManager {
  constructor(adapter) {
    if (!adapter) throw new Error('Persistence adapter required for PreferenceManager');
    this.adapter = adapter;
  }

  /**
   * Resolves user preferences with fallback to regional defaults
   */
  async getUserPreferences(userId, user = null) {
    if (!userId) {
      return { ...DEFAULT_USER_PREFERENCES, userId: 'anonymous' };
    }

    const stored = await this.adapter.getUserPreferences(userId);
    if (!stored) {
      return {
        ...DEFAULT_USER_PREFERENCES,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      ...DEFAULT_USER_PREFERENCES,
      ...stored,
      userId,
    };
  }

  /**
   * Updates user preferences with strict data validation & minimization
   */
  async updateUserPreferences(userId, updates = {}, user = null) {
    if (!userId) {
      const err = new Error('User ID is required to update preferences');
      err.code = AUDIENCE_ERROR_CODES.ERR_PREFERENCE_VALIDATION;
      err.statusCode = 400;
      throw err;
    }

    // Permission check: user can only edit self unless elevated
    if (user && user.id !== userId) {
      const roles = Array.isArray(user.roles) ? user.roles : [user.role || ''];
      const isAdmin = roles.some((r) => ['ADMIN', 'SUPER_ADMIN'].includes(String(r).toUpperCase()));
      if (!isAdmin) {
        const err = new Error('अनधिकृत: आप केवल अपनी प्राथमिकताओं में संशोधन कर सकते हैं।');
        err.code = AUDIENCE_ERROR_CODES.ERR_FORBIDDEN;
        err.statusCode = 403;
        throw err;
      }
    }

    const current = await this.getUserPreferences(userId, user);

    // Validate Language
    let preferredLanguage = current.preferredLanguage;
    if (updates.preferredLanguage !== undefined) {
      if (!['hi', 'en'].includes(updates.preferredLanguage)) {
        const err = new Error('भाषा केवल "hi" (हिन्दी) अथवा "en" (English) मान्य है');
        err.code = AUDIENCE_ERROR_CODES.ERR_PREFERENCE_VALIDATION;
        err.statusCode = 400;
        throw err;
      }
      preferredLanguage = updates.preferredLanguage;
    }

    // Validate Preferred Districts
    let preferredDistricts = current.preferredDistricts;
    if (updates.preferredDistricts !== undefined) {
      if (!Array.isArray(updates.preferredDistricts)) {
        const err = new Error('preferredDistricts array होना अनिवार्य है');
        err.code = AUDIENCE_ERROR_CODES.ERR_PREFERENCE_VALIDATION;
        err.statusCode = 400;
        throw err;
      }
      preferredDistricts = [...new Set(updates.preferredDistricts.map(String).slice(0, 20))];
    }

    // Validate Preferred Categories
    let preferredCategories = current.preferredCategories;
    if (updates.preferredCategories !== undefined) {
      if (!Array.isArray(updates.preferredCategories)) {
        const err = new Error('preferredCategories array होना अनिवार्य है');
        err.code = AUDIENCE_ERROR_CODES.ERR_PREFERENCE_VALIDATION;
        err.statusCode = 400;
        throw err;
      }
      preferredCategories = [...new Set(updates.preferredCategories.map(String).slice(0, 20))];
    }

    // Validate Followed Topics
    let followedTopics = current.followedTopics;
    if (updates.followedTopics !== undefined) {
      if (!Array.isArray(updates.followedTopics)) {
        const err = new Error('followedTopics array होना अनिवार्य है');
        err.code = AUDIENCE_ERROR_CODES.ERR_PREFERENCE_VALIDATION;
        err.statusCode = 400;
        throw err;
      }
      followedTopics = [...new Set(updates.followedTopics.map(String).slice(0, AUDIENCE_LIMITS.MAX_FOLLOWED_ENTITIES_PER_USER))];
    }

    const merged = {
      ...current,
      preferredLanguage,
      preferredDistricts,
      preferredCategories,
      followedTopics,
      notificationSettings: {
        ...current.notificationSettings,
        ...(updates.notificationSettings || {}),
      },
      privacySettings: {
        ...current.privacySettings,
        ...(updates.privacySettings || {}),
      },
      contentViewPreferences: {
        ...current.contentViewPreferences,
        ...(updates.contentViewPreferences || {}),
      },
      newsletterSubscribed: updates.newsletterSubscribed !== undefined
        ? Boolean(updates.newsletterSubscribed)
        : current.newsletterSubscribed || false,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.adapter.saveUserPreferences(userId, merged, user);
    return saved;
  }

  /**
   * Resets personalization settings to neutral defaults without filter bubbles
   */
  async resetPersonalization(userId, user = null) {
    if (!userId) throw new Error('User ID required to reset personalization');

    const resetPayload = {
      preferredDistricts: ['भोपाल'],
      preferredCategories: ['state', 'politics', 'development'],
      followedTopics: [],
      contentViewPreferences: {
        readingMode: 'standard',
      },
      updatedAt: new Date().toISOString(),
    };

    return this.updateUserPreferences(userId, resetPayload, user);
  }

  /**
   * DPDPA 2023 Right to Data Portability: Generates structured data package
   */
  async exportUserData(userId, user = null) {
    if (!userId) throw new Error('User ID required for data export');

    const [preferences, bookmarks, history, feedback] = await Promise.all([
      this.getUserPreferences(userId, user),
      this.adapter.getBookmarks ? this.adapter.getBookmarks(userId) : [],
      this.adapter.getReadingHistory ? this.adapter.getReadingHistory(userId, 100) : [],
      this.adapter.getReaderFeedback ? this.adapter.getReaderFeedback({ userId }) : [],
    ]);

    const exportPackage = {
      exportId: `dexp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      userId,
      platform: 'BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)',
      complianceStandard: 'Digital Personal Data Protection Act (DPDPA 2023)',
      exportedAt: new Date().toISOString(),
      data: {
        profilePreferences: preferences,
        savedBookmarks: bookmarks,
        recentReadingHistory: history,
        submittedFeedback: feedback,
      },
      securityChecksum: crypto
        .createHash('sha256')
        .update(JSON.stringify({ userId, bookmarksCount: bookmarks.length, historyCount: history.length }))
        .digest('hex'),
    };

    return exportPackage;
  }

  /**
   * DPDPA 2023 Right to Erasure: Records a structured account deletion request
   */
  async requestUserAccountDeletion(userId, reason = 'Reader request', user = null) {
    if (!userId) throw new Error('User ID required for deletion request');

    const deletionRecord = {
      id: `del-req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      userId,
      requestedAt: new Date().toISOString(),
      reason,
      status: 'PENDING_GRACE_PERIOD',
      gracePeriodEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30-day grace period
      messageHi: 'आपका खाता विलोपन अनुरोध दर्ज कर लिया गया है। 30 दिनों की अनुग्रह अवधि में आप कभी भी पुनः लॉग इन कर इसे रद्द कर सकते हैं।',
    };

    if (this.adapter.saveDeletionRequest) {
      await this.adapter.saveDeletionRequest(deletionRecord, user);
    }

    if (this.adapter.addAuditLog) {
      this.adapter.addAuditLog(
        user?.fullName || userId,
        'PRIVACY_GOVERNANCE',
        'ACCOUNT_DELETION_REQUESTED',
        `खाता विलोपन अनुरोध: ${userId} [कारण: ${reason}]`,
        null
      );
    }

    return deletionRecord;
  }
}

