/**
 * BREAKING NEWS WALA — Video Production Studio & FFmpeg Pipeline Constants
 * Grounded in docs/11-Architecture.md, docs/12-Database.md (DOM-I),
 * docs/16-Storage.md, docs/20-Integrations.md (INT-VID-013), and docs/DECISIONS.md (DEC-048, DEC-060)
 */

import { VideoAspectRatio, VideoResolution } from '@bnw/types';
import { BRAND_COLORS, TYPOGRAPHY } from '@bnw/tokens';

export interface AspectRatioPresetConfig {
  aspectRatio: VideoAspectRatio;
  width: number;
  height: number;
  labelHi: string;
  labelEn: string;
  defaultFps: number;
  useCase: string;
}

export const VIDEO_ASPECT_RATIO_PRESETS: Record<VideoAspectRatio, AspectRatioPresetConfig> = {
  '16:9': {
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    labelHi: 'लैंडस्केप 16:9 (यूट्यूब / वेब न्यूज़)',
    labelEn: 'Landscape 16:9 (YouTube & Web News)',
    defaultFps: 30,
    useCase: 'YouTube Full Videos, Web Portal News Bulletin, Desktop View',
  },
  '9:16': {
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    labelHi: 'वर्टिकल 9:16 (रील्स / शॉर्ट्स / मोबाइल)',
    labelEn: 'Vertical 9:16 (Reels & Shorts)',
    defaultFps: 30,
    useCase: 'Instagram Reels, YouTube Shorts, Mobile PWA News Reel',
  },
  '1:1': {
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    labelHi: 'स्क्वायर 1:1 (सोशल मीडिया फ़ीड)',
    labelEn: 'Square 1:1 (Social Feed)',
    defaultFps: 30,
    useCase: 'Instagram / Facebook Square Video Posts, Quick Breaking Snippets',
  },
  '4:5': {
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    labelHi: 'पोर्ट्रेट 4:5 (इंस्टाग्राम फ़ीड)',
    labelEn: 'Portrait 4:5 (Instagram Feed)',
    defaultFps: 30,
    useCase: 'Instagram Feed Vertical Video, Social Story Cards',
  },
  custom: {
    aspectRatio: 'custom',
    width: 1920,
    height: 1080,
    labelHi: 'कस्टम अनुपात (Custom Resolution)',
    labelEn: 'Custom Aspect Ratio',
    defaultFps: 30,
    useCase: 'Custom Dimension Video Canvas',
  },
};

export const VIDEO_RESOLUTION_SPECS: Record<
  VideoResolution,
  { label: string; widthMultiplier: number; heightMultiplier: number; bitrateKbps: number }
> = {
  '4k': { label: 'Ultra HD 4K', widthMultiplier: 2.0, heightMultiplier: 2.0, bitrateKbps: 15000 },
  '1080p': { label: 'Full HD 1080p', widthMultiplier: 1.0, heightMultiplier: 1.0, bitrateKbps: 4500 },
  '720p': { label: 'HD 720p', widthMultiplier: 0.6667, heightMultiplier: 0.6667, bitrateKbps: 2500 },
  '480p': { label: 'SD 480p', widthMultiplier: 0.4444, heightMultiplier: 0.4444, bitrateKbps: 1200 },
};

export const VIDEO_CONSTRAINTS = {
  MIN_DURATION_SEC: 1,
  MAX_DURATION_SEC: 600, // 10 minutes max for digital newsroom videos
  MAX_TRACKS: 10,
  MAX_CLIPS_PER_TRACK: 50,
  MAX_TOTAL_CLIPS: 200,
  MAX_SUBTITLE_CUES: 500,
  DEFAULT_FPS: 30,
  ALLOWED_FPS: [24, 25, 30, 60],
  DEFAULT_AUDIO_SAMPLE_RATE: 48000,
  DEFAULT_AUDIO_CHANNELS: 2,
  MAX_VIDEO_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100 MB
  MAX_AUDIO_FILE_SIZE_BYTES: 25 * 1024 * 1024,  // 25 MB
  DEFAULT_BUMPER_DURATION_SEC: 3.0,
  MIN_BUMPER_DURATION_SEC: 1.0,
  MAX_BUMPER_DURATION_SEC: 5.0,
} as const;

export const VIDEO_ALLOWED_CODECS = {
  VIDEO: ['libx264', 'libx265', 'h264_nvenc', 'hevc_nvenc', 'copy'],
  AUDIO: ['aac', 'libmp3lame', 'libopus', 'copy'],
  CONTAINER: ['mp4', 'webm', 'mov'],
} as const;

export const VIDEO_NEWS_CATEGORIES = [
  { id: 'breaking', nameHi: 'ब्रेकिंग न्यूज़', nameEn: 'Breaking News' },
  { id: 'politics', nameHi: 'राजनीति व चुनाव', nameEn: 'Politics & Elections' },
  { id: 'district', nameHi: 'ज़िला व आंचलिक', nameEn: 'District & Regional' },
  { id: 'crime', nameHi: 'अपराध व सुरक्षा', nameEn: 'Crime & Security' },
  { id: 'administration', nameHi: 'शासन व प्रशासन', nameEn: 'Governance & Administration' },
  { id: 'weather', nameHi: 'मौसम अलर्ट', nameEn: 'Weather Alert' },
  { id: 'business', nameHi: 'व्यापार व मंडी', nameEn: 'Business & Mandi' },
  { id: 'sports', nameHi: 'खेल व युवा', nameEn: 'Sports' },
  { id: 'entertainment', nameHi: 'मनोरंजन व कला', nameEn: 'Entertainment' },
  { id: 'education', nameHi: 'शिक्षा व करियर', nameEn: 'Education' },
  { id: 'health', nameHi: 'स्वास्थ्य व जीवन', nameEn: 'Health & Lifestyle' },
  { id: 'agriculture', nameHi: 'कृषि व ग्रामीण', nameEn: 'Agriculture' },
  { id: 'development', nameHi: 'विकास व इंफ्रास्ट्रक्चर', nameEn: 'Development & Infrastructure' },
  { id: 'interview', nameHi: 'विशेष साक्षात्कार', nameEn: 'Exclusive Interview' },
  { id: 'bulletin', nameHi: 'दैनिक बुलेटिन (Top 10)', nameEn: 'Daily Bulletin' },
] as const;

export const CANONICAL_VIDEO_BRAND = {
  channelNameHi: 'ब्रेकिंग न्यूज़ वाला',
  channelNameEn: 'BREAKING NEWS WALA',
  officialLogoUrl: '/brand/logo.png',
  officialLogoHash: '88407B32CCF924B10CCD6C9E17DF367D36C174AE7DEF441A26D8E5FDC035209F',
  colors: {
    primaryYellow: BRAND_COLORS.primaryYellow,
    primaryRed: BRAND_COLORS.primaryRed,
    primaryBlue: BRAND_COLORS.primaryBlue,
    charcoal: BRAND_COLORS.charcoal,
    midnight: BRAND_COLORS.midnight,
    pureWhite: BRAND_COLORS.pureWhite,
  },
  typography: {
    headlineFont: TYPOGRAPHY.fontHeadline[0],
    bodyFont: TYPOGRAPHY.fontBody[0],
    numberFont: TYPOGRAPHY.fontNumber[0],
  },
  introBumperUrl: '/assets/video/intro-sting-3s.mp4',
  outroBumperUrl: '/assets/video/outro-sting-3s.mp4',
  watermarkUrl: '/brand/watermark-top-right.png',
} as const;

export const OVERLAY_PRESETS = {
  BREAKING_TICKER: {
    type: 'ticker',
    heightPx: 72,
    backgroundColor: BRAND_COLORS.primaryRed,
    textColor: BRAND_COLORS.pureWhite,
    fontFamily: TYPOGRAPHY.fontHeadline[0],
    fontSizePx: 28,
    speedPxPerSec: 120,
    badgeTextHi: 'ताज़ा ख़बर',
  },
  LOWER_THIRD_SPEAKER: {
    type: 'lower_third',
    heightPx: 120,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    accentColor: BRAND_COLORS.primaryYellow,
    headlineColor: BRAND_COLORS.pureWhite,
    sublineColor: '#cbd5e1',
    fontFamily: TYPOGRAPHY.fontHeadline[0],
    fontSizeHeadlinePx: 32,
    fontSizeSublinePx: 22,
  },
  BUREAU_TAG: {
    type: 'bureau_tag',
    backgroundColor: BRAND_COLORS.primaryBlue,
    textColor: BRAND_COLORS.pureWhite,
    fontSizePx: 20,
    defaultLocationHi: 'भोपाल ब्यूरो',
  },
  HEADLINE_BANNER: {
    type: 'headline_banner',
    heightPx: 140,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    textColor: BRAND_COLORS.pureWhite,
    fontSizePx: 38,
    fontFamily: TYPOGRAPHY.fontHeadline[0],
  },
} as const;
