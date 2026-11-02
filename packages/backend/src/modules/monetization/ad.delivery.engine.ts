/**
 * BREAKING NEWS WALA — Ad Delivery, Viewability & Fraud Protection Engine
 * Grounded in docs/Monetization.md, docs/06-Business-Rules.md (RULE-AD-001 to RULE-AD-005)
 */

import { AdPlacementCode, AdCampaignItem, AdCreativeItem } from '@bnw/types';
import {
  AD_DELIVERY_CONSTANTS,
  ASCI_DISCLOSURE_LABEL_HI,
  ASCI_SPONSORED_LABEL_HI,
} from './monetization.constants';
import {
  AdDeliveryServingResult,
  ImpressionVerificationDto,
  ClickVerificationDto,
} from './types';

export class AdDeliveryEngine {
  // Sliding window memory for click velocity caps: Map<ipAddress, timestamps[]>
  private clickTimestampsByIp: Map<string, number[]> = new Map();

  /**
   * Checks whether the request user-agent originates from an automated bot or crawler
   */
  public isBot(userAgent: string): boolean {
    if (!userAgent) return true;
    return AD_DELIVERY_CONSTANTS.BOT_USER_AGENTS_REGEX.test(userAgent);
  }

  /**
   * Evaluates MRC standard viewable impression criteria:
   * >= 50% in viewport for >= 1000ms continuous view
   */
  public isViewableImpression(dto: ImpressionVerificationDto): { isValid: boolean; reason?: string } {
    if (this.isBot(dto.userAgent)) {
      return { isValid: false, reason: 'Bot/Crawler detected' };
    }

    if (dto.viewPercentage < AD_DELIVERY_CONSTANTS.MIN_VIEWABLE_PERCENTAGE) {
      return {
        isValid: false,
        reason: `Insufficient viewport visibility: ${dto.viewPercentage}% (Required >= ${AD_DELIVERY_CONSTANTS.MIN_VIEWABLE_PERCENTAGE}%)`,
      };
    }

    if (dto.viewDurationMs < AD_DELIVERY_CONSTANTS.MIN_VIEWABLE_DURATION_MS) {
      return {
        isValid: false,
        reason: `Insufficient view duration: ${dto.viewDurationMs}ms (Required >= ${AD_DELIVERY_CONSTANTS.MIN_VIEWABLE_DURATION_MS}ms)`,
      };
    }

    return { isValid: true };
  }

  /**
   * Rate limits clicks per IP to prevent click-fraud / bot spam (Max 5 clicks / 60s)
   */
  public checkClickVelocity(ipAddress: string): { isAllowed: boolean; currentCount: number } {
    const now = Date.now();
    const windowStart = now - AD_DELIVERY_CONSTANTS.CLICK_WINDOW_MS;

    const timestamps = (this.clickTimestampsByIp.get(ipAddress) || []).filter(
      (ts) => ts > windowStart
    );

    if (timestamps.length >= AD_DELIVERY_CONSTANTS.MAX_CLICKS_PER_MINUTE_PER_IP) {
      return { isAllowed: false, currentCount: timestamps.length };
    }

    timestamps.push(now);
    this.clickTimestampsByIp.set(ipAddress, timestamps);

    return { isAllowed: true, currentCount: timestamps.length };
  }

  /**
   * Validates click event against bot filters and click velocity caps
   */
  public isLegitimateClick(dto: ClickVerificationDto): { isValid: boolean; reason?: string } {
    if (this.isBot(dto.userAgent)) {
      return { isValid: false, reason: 'Bot/Crawler detected' };
    }

    const velocity = this.checkClickVelocity(dto.ipAddress);
    if (!velocity.isAllowed) {
      return {
        isValid: false,
        reason: `Click velocity cap exceeded: ${velocity.currentCount} clicks in 60s`,
      };
    }

    return { isValid: true };
  }

  /**
   * Selects an active, approved, and budget-eligible ad creative for a given placement slot
   */
  public selectAdForSlot(
    slotCode: AdPlacementCode,
    campaigns: AdCampaignItem[],
    creatives: AdCreativeItem[],
    options?: {
      targetDistrictId?: string;
      userAgent?: string;
    }
  ): AdDeliveryServingResult {
    const now = new Date();

    // 1. Filter campaigns that are ACTIVE, within date window, and within budget
    const activeCampaigns = campaigns.filter((c) => {
      if (c.status !== 'ACTIVE') return false;
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      if (now < start || now > end) return false;
      if (c.totalBudgetMinorUnits > 0 && c.spentBudgetMinorUnits >= c.totalBudgetMinorUnits) return false;
      return true;
    });

    if (activeCampaigns.length === 0) {
      return { served: false, adSlotCode: slotCode, reason: 'No active eligible campaigns' };
    }

    const activeCampaignIds = new Set(activeCampaigns.map((c) => c.id));

    // 2. Filter approved creatives for the specified slotCode
    const candidateCreatives = creatives.filter((cr) => {
      if (!activeCampaignIds.has(cr.campaignId)) return false;
      if (cr.adSlotCode !== slotCode) return false;
      if (!cr.isApproved) return false;

      // Geotargeting match: if creative or campaign specifies target districts
      if (options?.targetDistrictId && cr.targetDistrictId) {
        if (cr.targetDistrictId !== options.targetDistrictId) return false;
      }

      return true;
    });

    if (candidateCreatives.length === 0) {
      return { served: false, adSlotCode: slotCode, reason: 'No approved creatives for slot' };
    }

    // Pick first or round-robin candidate
    const chosenCreative = candidateCreatives[0];
    if (!chosenCreative) {
      return { served: false, adSlotCode: slotCode, reason: 'No approved creatives for slot' };
    }
    const parentCampaign = activeCampaigns.find((c) => c.id === chosenCreative.campaignId);
    if (!parentCampaign) {
      return { served: false, adSlotCode: slotCode, reason: 'Parent campaign not found' };
    }

    const asciLabel =
      chosenCreative.creativeType === 'SPONSORED_ARTICLE'
        ? ASCI_SPONSORED_LABEL_HI
        : ASCI_DISCLOSURE_LABEL_HI;

    return {
      served: true,
      adSlotCode: slotCode,
      creative: {
        id: chosenCreative.id,
        campaignId: parentCampaign.id,
        advertiserName: parentCampaign.advertiserName,
        headlineHi: chosenCreative.headlineHi,
        bodyTextHi: chosenCreative.bodyTextHi,
        destinationUrl: chosenCreative.destinationUrl,
        mediaUrl: chosenCreative.creativeMediaUrl,
        creativeType: chosenCreative.creativeType,
        width: chosenCreative.width,
        height: chosenCreative.height,
        asciLabel,
      },
    };
  }
}
