/**
 * @bnw/tokens — Canonical Design Tokens & Brand System
 * Grounded strictly in docs/07-Design.md and docs/DECISIONS.md (DEC-013, DEC-059)
 */

export const BRAND_COLORS = {
  primaryYellow: '#FDE900', // Breaking Badge, Ticker Highlights, Warning Accents
  primaryRed: '#ED1727',    // Breaking News Ribbon, Live Stream Badges, Urgent Alerts
  primaryBlue: '#344FD6',   // Journalistic Links, Interactive Buttons, Verified Badges
  charcoal: '#1F2937',      // Primary Headline & Body Text (High Contrast)
  midnight: '#111827',      // Deep Masthead & Footer Surface
  pureWhite: '#FFFFFF',     // Clean Card & Background Surface
} as const;

export const SEMANTIC_COLORS = {
  success: '#10B981',       // Published / Verified State
  warning: '#F59E0B',       // Under Review / Pending State
  error: '#ED1727',         // Rejected / Validation Error State
  info: '#344FD6',          // Informational Notice State
  retracted: '#6B7280',     // Retracted Story Tombstone State
} as const;

export const TYPOGRAPHY = {
  fontHeadline: ['Rozha One', 'serif'],
  fontBody: ['Noto Sans Devanagari', 'sans-serif'],
  fontNumber: ['Inter', 'sans-serif'],
} as const;
