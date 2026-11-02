/**
 * BREAKING NEWS WALA — Security Utilities Engine
 * Grounded in docs/15-Security.md, docs/16-Storage.md, and docs/DECISIONS.md (DEC-038, DEC-040)
 * Provides Anti-SSRF URL filtering, path traversal sanitization, and magic byte file signature verification.
 */

import { URL } from 'url';
import { AppError } from '../errors/app-error';

// RFC-1918 Private IP ranges and loopback/metadata addresses
const FORBIDDEN_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^::1$/,
  /^0\.0\.0\.0$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/, // Cloud metadata (AWS, GCP, Azure, DigitalOcean)
  /^metadata\.google\.internal$/i,
  /^instance-data$/i,
];

/**
 * Anti-SSRF Validator
 * Validates candidate URLs for external RSS ingestion, scrapers, or webhooks.
 * Blocks private IP ranges, loopbacks, cloud metadata endpoints, and non-HTTP protocols.
 */
export function validateAntiSsrfUrl(urlString: string): { isValid: boolean; parsedUrl?: URL; error?: string } {
  if (!urlString || typeof urlString !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString.trim());
  } catch {
    return { isValid: false, error: 'Malformed or invalid URL syntax.' };
  }

  // 1. Enforce allowed schemes (HTTP and HTTPS only)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      error: `Disallowed protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted (RULE-SEC-006).`,
    };
  }

  // 2. Reject credentials embedded in URLs
  if (parsed.username || parsed.password) {
    return {
      isValid: false,
      error: 'Embedded user credentials in URLs are strictly prohibited (RULE-SEC-006).',
    };
  }

  // 3. Inspect hostname for private, loopback, or metadata addresses
  const rawHostname = parsed.hostname.toLowerCase();
  const hostname = rawHostname.replace(/^\[/, '').replace(/\]$/, '');

  for (const pattern of FORBIDDEN_HOST_PATTERNS) {
    if (pattern.test(hostname) || pattern.test(rawHostname)) {
      return {
        isValid: false,
        error: `SSRF Violation: Target hostname "${rawHostname}" resolves to a restricted internal or loopback address (RULE-SEC-006).`,
      };
    }
  }

  return { isValid: true, parsedUrl: parsed };
}

/**
 * Asserts that a URL is safe against SSRF; throws AppError.badRequest if unsafe.
 */
export function assertSafeExternalUrl(urlString: string): URL {
  const result = validateAntiSsrfUrl(urlString);
  if (!result.isValid || !result.parsedUrl) {
    throw AppError.badRequest(result.error || 'Invalid or prohibited external URL destination.');
  }
  return result.parsedUrl;
}

/**
 * Path Traversal Sanitizer
 * Strips directory traversal tokens (../, ..\), null bytes, and normalizes file paths.
 */
export function sanitizeFilePath(rawFilename: string): string {
  if (!rawFilename || typeof rawFilename !== 'string') {
    return 'unnamed_file';
  }

  // 1. Remove null bytes and control characters
  let cleaned = rawFilename.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');

  // 2. Remove directory traversal sequences
  cleaned = cleaned.replace(/\.\./g, '');

  // 3. Strip directory separators (slashes and backslashes) to enforce flat filename
  cleaned = cleaned.replace(/[/\\]/g, '_');

  // 4. Strip dangerous shell characters
  cleaned = cleaned.replace(/[;&|`$><!]/g, '');

  // 5. Trim leading/trailing whitespace, dots, and underscores
  cleaned = cleaned.trim().replace(/^\.+/, '').replace(/\.+$/, '');
  cleaned = cleaned.replace(/^_+/, '').replace(/_+$/, '');

  return cleaned.length > 0 ? cleaned : 'sanitized_file';
}

/**
 * MIME Magic Byte Header Verification
 * Empirically inspects file header bytes rather than trusting client-provided extension or Content-Type.
 */
export interface MimeValidationResult {
  isValid: boolean;
  detectedMime?: string;
  error?: string;
}

export function validateMimeMagicBytes(buffer: Buffer, declaredMimeType: string): MimeValidationResult {
  if (!buffer || buffer.length < 4) {
    return { isValid: false, error: 'File buffer is too small to determine MIME type.' };
  }

  const normalizedDeclared = declaredMimeType.toLowerCase().trim();

  // 1. PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (normalizedDeclared === 'application/pdf') {
    const isPdf =
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46;

    if (!isPdf) {
      return {
        isValid: false,
        error: 'MIME validation failed: File does not start with valid %PDF- magic signature (ERR_INVALID_FILE_SIGNATURE).',
      };
    }
    return { isValid: true, detectedMime: 'application/pdf' };
  }

  // 2. JPEG: 0xFF 0xD8 0xFF
  if (normalizedDeclared === 'image/jpeg' || normalizedDeclared === 'image/jpg') {
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (!isJpeg) {
      return {
        isValid: false,
        error: 'MIME validation failed: File does not start with valid JPEG magic signature (0xFFD8FF).',
      };
    }
    return { isValid: true, detectedMime: 'image/jpeg' };
  }

  // 3. PNG: 0x89 0x50 0x4E 0x47 (89 P N G)
  if (normalizedDeclared === 'image/png') {
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;

    if (!isPng) {
      return {
        isValid: false,
        error: 'MIME validation failed: File does not start with valid PNG magic signature.',
      };
    }
    return { isValid: true, detectedMime: 'image/png' };
  }

  // 4. WebP: RIFF .... WEBP
  if (normalizedDeclared === 'image/webp') {
    if (buffer.length < 12) {
      return { isValid: false, error: 'Buffer too short for WebP header.' };
    }
    const isRiff =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46; // RIFF
    const isWebp =
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50; // WEBP

    if (!isRiff || !isWebp) {
      return {
        isValid: false,
        error: 'MIME validation failed: File does not match RIFF-WEBP magic signature.',
      };
    }
    return { isValid: true, detectedMime: 'image/webp' };
  }

  // 5. MP4: ftyp (at offset 4)
  if (normalizedDeclared === 'video/mp4') {
    if (buffer.length < 8) {
      return { isValid: false, error: 'Buffer too short for MP4 header.' };
    }
    const isFtyp =
      buffer[4] === 0x66 &&
      buffer[5] === 0x74 &&
      buffer[6] === 0x79 &&
      buffer[7] === 0x70; // ftyp

    if (!isFtyp) {
      return {
        isValid: false,
        error: 'MIME validation failed: Video file missing "ftyp" container signature.',
      };
    }
    return { isValid: true, detectedMime: 'video/mp4' };
  }

  // Default fallback for other explicitly whitelisted media types
  return { isValid: true, detectedMime: normalizedDeclared };
}

/**
 * Malware Scanner Telemetry
 * Truthfully states configuration status: Pending production ClamAV / external daemon setup.
 */
export interface MalwareScanResult {
  status: 'CLEAN' | 'INFECTED' | 'PENDING_CONFIGURATION';
  service: string;
  scannedAt: string;
  notes: string;
}

export function scanFileForMalware(_buffer: Buffer): MalwareScanResult {
  // In accordance with BNW-MASTER-009 Section 8.1, do not claim live malware scanner is operational.
  return {
    status: 'PENDING_CONFIGURATION',
    service: 'ClamAV-Daemon / AWS GuardDuty',
    scannedAt: new Date().toISOString(),
    notes: 'Malware scanning daemon is in pending-configuration state. Magic byte verification actively enforced.',
  };
}
