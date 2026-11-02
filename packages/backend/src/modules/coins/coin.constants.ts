/**
 * BREAKING NEWS WALA — Coin Ledger & Rewards Constants & Boundaries
 * Grounded in docs/Monetization.md (Section 11), docs/DECISIONS.md (DEC-007),
 * docs/06-Business-Rules.md (RULE-REWARD-001, RULE-REWARD-002, RULE-REWARD-003),
 * and docs/13-API.md.
 */

import { RewardCatalogItem } from './types';

export const COIN_LIMITS = {
  // DEC-007 & docs/Monetization.md Section 11.2: Maximum 50 coins earned per 24h
  MAX_DAILY_EARNED_COINS: 50,

  // RULE-REWARD-003: Velocity escrow trigger: > 10 actions/min
  MAX_VELOCITY_ACTIONS_PER_MINUTE: 10,
  VELOCITY_WINDOW_MS: 60000,

  // docs/Monetization.md Section 11.2: 25 points bonus per verified referral
  REFERRAL_BONUS_REFERRER: 25,
  REFERRAL_BONUS_REFERRED: 25,

  // Safe transaction constraints
  MIN_TRANSACTION_AMOUNT: 1,
  MAX_SINGLE_TRANSACTION_AMOUNT: 500,
  MIN_ADMIN_REASON_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 255,

  // Formatting & Timezone
  REFERRAL_CODE_PREFIX: 'BNW-',
  TIMEZONE: 'Asia/Kolkata',
} as const;

export const TRANSACTION_TYPES = {
  ARTICLE_READ: 'article_read_reward',
  ARTICLE_SHARE: 'article_share_reward',
  REFERRAL_REFERRER: 'referral_bonus_referrer',
  REFERRAL_REFERRED: 'referral_bonus_referred',
  COMMENT: 'comment_reward',
  DAILY_STREAK: 'daily_streak_reward',
  DIGITAL_PERK: 'digital_perk_redemption',
  ADMIN_ADJUSTMENT: 'admin_adjustment',
  COMPENSATING_ADJUSTMENT: 'compensating_adjustment',
} as const;

/**
 * Approved Non-Monetary Perk Catalog (DEC-007)
 * Coins possess ZERO monetary cash equivalence and cannot be withdrawn.
 */
export const APPROVED_DIGITAL_PERKS: RewardCatalogItem[] = [
  {
    id: 'perk-ad-free-1d',
    code: 'AD_FREE_PASS_1D',
    nameHi: '1-दिवसीय विज्ञापन-मुक्त अनुभव',
    nameEn: '1-Day Ad-Free Reading Pass',
    coinCost: 50,
    category: 'ad_free_pass',
    status: 'active',
    descriptionHi: '24 घंटे के लिए सभी डिस्प्ले विज्ञापनों को निष्क्रिय करें।',
  },
  {
    id: 'perk-badge-verified-reader',
    code: 'BADGE_VERIFIED_CITIZEN',
    nameHi: 'प्रमाणित नागरिक पाठक बैज',
    nameEn: 'Verified Citizen Reader Badge',
    coinCost: 100,
    category: 'digital_badge',
    status: 'active',
    descriptionHi: 'टिप्पणियों और प्रोफाइल पर विशेष पाठक बैज प्रदर्शित करें।',
  },
  {
    id: 'perk-epaper-archive',
    code: 'EPAPER_ARCHIVE_PASS',
    nameHi: 'ई-पेपर ऐतिहासिक अभिलेखागार एक्सेस',
    nameEn: 'E-Paper Historical Archive Access',
    coinCost: 75,
    category: 'exclusive_epaper',
    status: 'active',
    descriptionHi: 'पिछले 30 दिनों के ई-पेपर संस्करणों का असीमित अवलोकन।',
  },
];

