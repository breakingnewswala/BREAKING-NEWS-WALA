/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Firebase Authentication & Server-Side RBAC Verification Service
 * 
 * Implements server-side Firebase ID token verification, cryptographic header validation,
 * token claim auditing, and authoritative role resolution against Firestore user records.
 * Grounded in docs/14-Auth.md, docs/15-Security.md, and BNW-MASTER-EXECUTION-012.
 */

import crypto from 'node:crypto';
import firebaseAppletConfig from '../../../firebase-applet-config.json' with { type: 'json' };

export const CANONICAL_PROJECT_ID = firebaseAppletConfig.projectId || 'breaking-news-wala';

export const MASTER_ADMIN_EMAILS = Object.freeze([
  'breakingnewswala.com@gmail.com',
  'riturajtomarorchha@gmail.com',
  'live.bnwtv@gmail.com',
]);

export function isMasterAdminEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return MASTER_ADMIN_EMAILS.includes(normalized);
}

export const MASTER_ADMIN_ROLES = Object.freeze([
  'MASTER_ADMIN',
  'SUPER_ADMIN',
  'ADMIN',
  'CHIEF_EDITOR',
  'EDITOR',
  'REPORTER',
  'READER',
]);

export const CANONICAL_ROLES = [
  'MASTER_ADMIN',
  'SUPER_ADMIN',
  'ADMIN',
  'CHIEF_EDITOR',
  'EDITOR',
  'REPORTER',
  'READER',
  'PUBLIC_CITIZEN',
];

export class FirebaseAuthService {
  constructor(options = {}) {
    this.projectId = options.projectId || process.env.FIREBASE_PROJECT_ID || CANONICAL_PROJECT_ID;
    this.emulatorHost = options.emulatorHost || process.env.FIREBASE_AUTH_EMULATOR_HOST || null;
    this.publicKeyCache = new Map();
    this.publicKeyCacheExpiry = 0;
  }

  /**
   * Safely decode a JWT without verification (for inspecting header & payload claims)
   */
  static decodeJwt(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      return {
        header,
        payload,
        signature: parts[2],
        rawHeader: parts[0],
        rawPayload: parts[1],
        signedData: `${parts[0]}.${parts[1]}`,
      };
    } catch {
      return null;
    }
  }

  /**
   * Verifies a Firebase ID token.
   * In production, validates against Google's public certs, claims, and expiration.
   * In test/emulator mode, validates structural claims and emulator identity.
   */
  async verifyIdToken(idToken, checkRevoked = false) {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('ERR_MISSING_ID_TOKEN: Authentication token is required.');
    }

    const decoded = FirebaseAuthService.decodeJwt(idToken);
    if (!decoded || !decoded.header || !decoded.payload) {
      throw new Error('ERR_MALFORMED_TOKEN: Token structure is invalid.');
    }

    const { header, payload } = decoded;

    // 1. Verify algorithm (RS256 in production; RS256 or 'none' in emulator/test)
    const isEmulator = Boolean(this.emulatorHost || process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.NODE_ENV === 'test');
    if (header.alg !== 'RS256' && (!isEmulator || (header.alg !== 'none' && header.alg !== 'RS256'))) {
      throw new Error(`ERR_INVALID_ALGORITHM: Expected RS256 algorithm, got ${header.alg}.`);
    }

    // 2. Verify audience matches Firebase project ID
    const expectedAudience = this.projectId;
    if (payload.aud !== expectedAudience) {
      throw new Error(`ERR_AUDIENCE_MISMATCH: Token aud (${payload.aud}) does not match project (${expectedAudience}).`);
    }

    // 3. Verify issuer matches https://securetoken.google.com/<projectId>
    const expectedIssuer = `https://securetoken.google.com/${expectedAudience}`;
    if (payload.iss !== expectedIssuer) {
      throw new Error(`ERR_ISSUER_MISMATCH: Token iss (${payload.iss}) does not match expected (${expectedIssuer}).`);
    }

    // 4. Verify subject (user UID) is non-empty string
    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.trim() === '') {
      throw new Error('ERR_INVALID_SUBJECT: Token sub claim must be a non-empty string.');
    }

    // 5. Verify expiration
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (!payload.exp || typeof payload.exp !== 'number' || payload.exp < (nowInSeconds - 30)) {
      throw new Error('ERR_TOKEN_EXPIRED: Firebase ID token has expired.');
    }

    // 6. Verify issued-at timestamp
    if (!payload.iat || typeof payload.iat !== 'number' || payload.iat > (nowInSeconds + 30)) {
      throw new Error('ERR_TOKEN_FUTURE: Token issued-at timestamp is in the future.');
    }

    // 7. Emulator mode bypass for cryptographic RSA verification
    if (isEmulator || process.env.NODE_ENV === 'test') {
      return {
        uid: payload.sub,
        email: payload.email || null,
        emailVerified: Boolean(payload.email_verified),
        displayName: payload.name || payload.displayName || null,
        photoUrl: payload.picture || payload.photoUrl || null,
        phoneNumber: payload.phone_number || null,
        claims: payload,
      };
    }

    // 8. Cryptographic RSA-SHA256 signature verification with Google Public Keys
    try {
      const publicKeys = await this.fetchGooglePublicKeys();
      const kid = header.kid;
      const cert = publicKeys[kid];
      if (!cert) {
        throw new Error(`ERR_UNKNOWN_KID: No public key matching kid "${kid}".`);
      }

      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(decoded.signedData);
      const isValid = verifier.verify(cert, decoded.signature, 'base64url');

      if (!isValid) {
        throw new Error('ERR_SIGNATURE_INVALID: Cryptographic signature verification failed.');
      }
    } catch (err) {
      if (err.message.startsWith('ERR_')) throw err;
      throw new Error(`ERR_VERIFICATION_FAILED: ${err.message}`);
    }

    return {
      uid: payload.sub,
      email: payload.email || null,
      emailVerified: Boolean(payload.email_verified),
      displayName: payload.name || payload.displayName || null,
      photoUrl: payload.picture || payload.photoUrl || null,
      phoneNumber: payload.phone_number || null,
      claims: payload,
    };
  }

  /**
   * Fetch and cache Google OAuth2 public certificates
   */
  async fetchGooglePublicKeys() {
    const now = Date.now();
    if (this.publicKeyCache.size > 0 && now < this.publicKeyCacheExpiry) {
      return Object.fromEntries(this.publicKeyCache);
    }

    const certUrl = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
    const response = await fetch(certUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Google public keys: HTTP ${response.status}`);
    }

    const data = await response.json();
    this.publicKeyCache.clear();
    for (const [k, v] of Object.entries(data)) {
      this.publicKeyCache.set(k, v);
    }

    // Cache control parsing (default 1 hour)
    const cacheControl = response.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
    this.publicKeyCacheExpiry = now + maxAgeSec * 1000;

    return data;
  }

  /**
   * Authoritative Server-Side RBAC Resolution:
   * Firebase Auth guarantees identity (UID). Authoritative permissions and roles
   * MUST be resolved from Firestore user document to prevent client spoofing.
   * If token carries verified Master Admin email, grants MASTER_ADMIN override.
   */
  async resolveAuthoritativeUser(uid, persistenceAdapter, tokenEmail = null, emailVerified = false) {
    if (!uid || typeof uid !== 'string') return null;

    let userDoc = null;
    if (persistenceAdapter && typeof persistenceAdapter.findUserById === 'function') {
      userDoc = await persistenceAdapter.findUserById(uid);
    }

    const effectiveEmail = (tokenEmail || userDoc?.email || '').toLowerCase().trim();
    const isMaster = Boolean(emailVerified && isMasterAdminEmail(effectiveEmail));

    if (!userDoc) {
      return null;
    }

    // Account status guard: suspended or inactive users are rejected
    if (userDoc.status && userDoc.status !== 'active') {
      const err = new Error(`ERR_ACCOUNT_DISABLED: Account status is ${userDoc.status}. Access denied.`);
      err.code = 'ERR_ACCOUNT_DISABLED';
      err.statusCode = 403;
      throw err;
    }

    // Authoritative role resolution: Master Admin accounts receive MASTER_ADMIN override ONLY when verified
    let authoritativeRoles = Array.isArray(userDoc.roles) && userDoc.roles.length > 0
      ? userDoc.roles
      : [userDoc.role || 'READER'];

    if (isMaster) {
      authoritativeRoles = [...MASTER_ADMIN_ROLES];
    } else if (isMasterAdminEmail(effectiveEmail) && !emailVerified) {
      // Security invariant: unverified email claims MUST NOT possess Master Admin roles
      authoritativeRoles = authoritativeRoles.filter((r) => r !== 'MASTER_ADMIN' && r !== 'SUPER_ADMIN');
      if (authoritativeRoles.length === 0) {
        authoritativeRoles = ['READER'];
      }
    }

    return {
      id: userDoc.id || uid,
      uid,
      email: userDoc.email || effectiveEmail || null,
      displayName: userDoc.fullName || userDoc.displayName || 'BNW User',
      roles: authoritativeRoles,
      status: userDoc.status || 'active',
      district: userDoc.district || null,
      division: userDoc.division || null,
      state: userDoc.state || 'मध्य प्रदेश',
      badgeNumber: userDoc.badgeNumber || null,
    };
  }

  /**
   * Check if a resolved authoritative user has the required permission role
   */
  static hasRole(user, allowedRoles) {
    if (!user || !user.roles) return false;
    if (user.roles.includes('MASTER_ADMIN') || user.roles.includes('SUPER_ADMIN')) return true; // Master/Super Admin has universal access
    return allowedRoles.some((role) => user.roles.includes(role));
  }
}

export const defaultFirebaseAuthService = new FirebaseAuthService();

