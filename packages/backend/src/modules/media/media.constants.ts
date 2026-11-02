/**
 * BREAKING NEWS WALA — Media Constants & Security Whitelists
 * Grounded in docs/16-Storage.md (Section 9.1) and docs/06-Business-Rules.md (RULE-NEWS-006, RULE-SEC-004)
 */

export const ASSET_TYPES = ['image', 'video', 'audio', 'document'] as const;
export type AssetType = typeof ASSET_TYPES[number];

export const PROCESSING_STATUSES = [
  'pending_upload',
  'uploaded',
  'quarantined',
  'processing',
  'ready',
  'failed',
  'archived',
] as const;
export type ProcessingStatus = typeof PROCESSING_STATUSES[number];

export const ACCESS_CLASSIFICATIONS = ['public', 'private', 'confidential'] as const;
export type AccessClassification = typeof ACCESS_CLASSIFICATIONS[number];

/**
 * Approved Maximum File Size Limits by Category (in bytes)
 * Grounded in docs/16-Storage.md §9.1 and RULE-NEWS-006
 */
export const FILE_SIZE_LIMITS: Record<AssetType, number> = {
  image: 10 * 1024 * 1024,      // 10 MB maximum for high-res field imagery
  video: 100 * 1024 * 1024,     // 100 MB maximum for mobile video reels & field rushes
  audio: 25 * 1024 * 1024,      // 25 MB maximum for voiceover recordings and dispatches
  document: 25 * 1024 * 1024,   // 25 MB maximum for regional e-paper PDF editions
};

/**
 * Avatar size limit for public citizen profile photos
 */
export const AVATAR_SIZE_LIMIT = 2 * 1024 * 1024; // 2 MB

/**
 * Strict MIME Type to Category and Extension Mapping
 */
export interface MimeTypeDefinition {
  assetType: AssetType;
  extensions: string[];
  description: string;
}

export const MIME_TYPE_WHITELIST: Record<string, MimeTypeDefinition> = {
  'image/jpeg': {
    assetType: 'image',
    extensions: ['.jpg', '.jpeg'],
    description: 'JPEG Image',
  },
  'image/png': {
    assetType: 'image',
    extensions: ['.png'],
    description: 'PNG Image',
  },
  'image/webp': {
    assetType: 'image',
    extensions: ['.webp'],
    description: 'WebP Modern Image',
  },
  'video/mp4': {
    assetType: 'video',
    extensions: ['.mp4'],
    description: 'MPEG-4 Video',
  },
  'video/quicktime': {
    assetType: 'video',
    extensions: ['.mov'],
    description: 'QuickTime Video',
  },
  'video/webm': {
    assetType: 'video',
    extensions: ['.webm'],
    description: 'WebM Video',
  },
  'audio/mpeg': {
    assetType: 'audio',
    extensions: ['.mp3'],
    description: 'MP3 Audio',
  },
  'audio/mp4': {
    assetType: 'audio',
    extensions: ['.m4a', '.mp4'],
    description: 'MPEG-4 Audio / AAC',
  },
  'audio/wav': {
    assetType: 'audio',
    extensions: ['.wav'],
    description: 'WAV Audio',
  },
  'application/pdf': {
    assetType: 'document',
    extensions: ['.pdf'],
    description: 'Portable Document Format',
  },
};

/**
 * Prohibited Executable & Script Extensions
 * Files with these extensions are rejected immediately (RULE-SEC-004)
 */
export const PROHIBITED_EXTENSIONS = new Set([
  '.exe',
  '.sh',
  '.bat',
  '.cmd',
  '.com',
  '.scr',
  '.pif',
  '.vbs',
  '.js',
  '.ts',
  '.php',
  '.php3',
  '.php4',
  '.php5',
  '.phtml',
  '.py',
  '.rb',
  '.pl',
  '.cgi',
  '.jsp',
  '.asp',
  '.aspx',
  '.html',
  '.htm',
  '.jar',
  '.msi',
]);

/**
 * Presigned URL Default Time-To-Live in Seconds (15 minutes)
 * Grounded in docs/DECISIONS.md (DEC-020)
 */
export const PRESIGNED_URL_EXPIRY_SECONDS = 900;

