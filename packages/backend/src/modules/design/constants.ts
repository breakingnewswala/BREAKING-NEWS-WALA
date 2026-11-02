/**
 * BREAKING NEWS WALA — Graphics & Design Studio Constants
 * Grounded in docs/07-Design.md, docs/12-Database.md (DOM-H), and docs/DECISIONS.md (DEC-057, DEC-060)
 */

import { CanvasDimensions, BrandAssetProfile } from '@bnw/types';
import { BRAND_COLORS, TYPOGRAPHY } from '@bnw/tokens';

export const PRESET_YOUTUBE_THUMBNAIL: CanvasDimensions = {
  width: 1280,
  height: 720,
  aspectRatio: '16:9',
  label: 'यूट्यूब थंबनेल (16:9 Landscape)',
};

export const PRESET_YOUTUBE_SHORTS: CanvasDimensions = {
  width: 1080,
  height: 1920,
  aspectRatio: '9:16',
  label: 'यूट्यूब शॉर्ट्स / रील्स (9:16 Portrait)',
};

export const PRESET_INSTAGRAM_PORTRAIT: CanvasDimensions = {
  width: 1080,
  height: 1350,
  aspectRatio: '4:5',
  label: 'इंस्टाग्राम पोर्ट्रेट (4:5 Feed)',
};

export const PRESET_INSTAGRAM_SQUARE: CanvasDimensions = {
  width: 1080,
  height: 1080,
  aspectRatio: '1:1',
  label: 'स्क्वायर पोस्ट (1:1 Square)',
};

export const PRESET_FACEBOOK_POST: CanvasDimensions = {
  width: 1200,
  height: 630,
  aspectRatio: '16:9',
  label: 'फ़ेसबुक पोस्ट (1200x630)',
};

export const PRESET_TWITTER_X_POST: CanvasDimensions = {
  width: 1200,
  height: 675,
  aspectRatio: '16:9',
  label: 'एक्स / ट्विटर पोस्ट (1200x675)',
};

export const PRESET_TWITTER_X_BANNER: CanvasDimensions = {
  width: 1500,
  height: 500,
  aspectRatio: 'custom',
  label: 'एक्स / ट्विटर हेडर (1500x500)',
};

export const CANVAS_PRESETS = {
  YOUTUBE_THUMBNAIL: PRESET_YOUTUBE_THUMBNAIL,
  YOUTUBE_SHORTS: PRESET_YOUTUBE_SHORTS,
  INSTAGRAM_PORTRAIT: PRESET_INSTAGRAM_PORTRAIT,
  INSTAGRAM_SQUARE: PRESET_INSTAGRAM_SQUARE,
  FACEBOOK_POST: PRESET_FACEBOOK_POST,
  TWITTER_X_POST: PRESET_TWITTER_X_POST,
  TWITTER_X_BANNER: PRESET_TWITTER_X_BANNER,
} as const;

export const TEMPLATE_CATEGORIES = [
  { id: 'breaking', nameHi: 'ब्रेकिंग न्यूज़ अलर्ट्स', description: 'अति-महत्वपूर्ण ताज़ा समाचार एवं फ़्लैश कार्ड्स' },
  { id: 'politics', nameHi: 'राजनीति व चुनाव', description: 'मंत्रिमंडल, विधानसभा, नीतियां व राजनीतिक गतिविधियां' },
  { id: 'district', nameHi: 'ज़िला व आंचलिक रिपोर्ट', description: 'मध्यप्रदेश के 55 ज़िलों की ज़मीनी कवरेज' },
  { id: 'crime', nameHi: 'अपराध व कानून-व्यवस्था', description: 'पुलिस कार्रवाई, कोर्ट फ़ैसले व सुरक्षा समाचार' },
  { id: 'quote', nameHi: 'विशिष्ट बयान / कोट कार्ड', description: 'प्रमुख हस्तियों, मंत्रियों व गवाहों के आधिकारिक बयान' },
  { id: 'data_stat', nameHi: 'आंकड़े व इंफ़ोग्राफ़िक्स', description: 'बजट, योजनाएं, सांख्यिकी व डेटा चार्ट्स' },
  { id: 'entertainment', nameHi: 'मनोरंजन व संस्कृति', description: 'सिनेमा, कला, मेले, त्योहार व सांस्कृतिक कार्यक्रम' },
  { id: 'sports', nameHi: 'खेलकूद व प्रतियोगिताएं', description: 'क्रिकेट, हॉकी, राष्ट्रीय खेल व क्षेत्रीय खिलाड़ी' },
  { id: 'youtube_thumb', nameHi: 'यूट्यूब वीडियो थंबनेल्स', description: 'हाई-क्लिक थंबनेल्स विद लार्ज हेडलाइन' },
  { id: 'social_story', nameHi: 'सोशल मीडिया स्टोरीज़', description: '9:16 वर्टिकल स्टोरीज़ एवं रील्स कवर्स' },
] as const;

export const CANONICAL_BRAND_ASSET: BrandAssetProfile = {
  id: 'bnw-brand-master-2026',
  channelNameHi: 'ब्रेकिंग न्यूज़ वाला',
  channelNameEn: 'BREAKING NEWS WALA',
  logoUrl: '/brand/logo.png',
  logoHash: '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F',
  primaryYellow: BRAND_COLORS.primaryYellow,
  primaryRed: BRAND_COLORS.primaryRed,
  primaryBlue: BRAND_COLORS.primaryBlue,
  charcoal: BRAND_COLORS.charcoal,
  midnight: BRAND_COLORS.midnight,
  pureWhite: BRAND_COLORS.pureWhite,
  approvedFonts: [
    { name: TYPOGRAPHY.fontHeadline[0], category: 'Headline Display', fallback: TYPOGRAPHY.fontHeadline[1] },
    { name: TYPOGRAPHY.fontBody[0], category: 'Body & Vernacular', fallback: TYPOGRAPHY.fontBody[1] },
    { name: TYPOGRAPHY.fontNumber[0], category: 'Numbers & English', fallback: TYPOGRAPHY.fontNumber[1] },
  ],
  watermarkEnabled: true,
  safeMarginPercent: 5,
};

export const STUDIO_LIMITS = {
  MAX_CANVAS_WIDTH: 4096,
  MAX_CANVAS_HEIGHT: 4096,
  MIN_CANVAS_WIDTH: 100,
  MIN_CANVAS_HEIGHT: 100,
  MAX_ELEMENTS_PER_CANVAS: 100,
  MAX_EXPORT_SCALE: 3,
  MAX_HISTORY_SNAPSHOTS: 30,
  MAX_TEXT_LENGTH: 500,
  MAX_HEADLINE_WORDS: 45,
  AUTOSAVE_INTERVAL_MS: 30000,
} as const;

export const STATUTORY_EMBLEM_WARNING =
  'Statutory Alert: Madhya Pradesh State Emblem or Ashoka Lion Capital must NOT be added to graphics (State Emblem of India Act 2005).';
