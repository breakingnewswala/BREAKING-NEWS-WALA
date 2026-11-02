/**
 * BREAKING NEWS WALA — Password Service
 * Grounded in docs/DECISIONS.md (DEC-034) and docs/14-Auth.md (Section 6.1, 6.2)
 * Enforces Argon2id cryptographic hashing (m=65536 KiB, t=3, p=4) and password complexity rules.
 */

import argon2 from 'argon2';

/**
 * Common breached passwords to reject outright during password validation.
 * Reference: docs/14-Auth.md Section 6.1
 */
const COMMON_BREACHED_PASSWORDS = new Set([
  'password123!',
  'password@123',
  'admin@2026',
  'admin12345!',
  'breakingnews123!',
  'welcome123!',
  'qwerty12345!',
  'letmein1234!',
]);

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PasswordService {
  // Argon2id parameters strictly defined by DEC-034 & docs/14-Auth.md
  private static readonly ARGON2_OPTIONS: argon2.HashOptions = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 4,    // 4 threads
  };

  /**
   * Hashes a plaintext password using Argon2id with approved cost parameters.
   */
  public async hash(password: string): Promise<string> {
    return argon2.hash(password, { ...PasswordService.ARGON2_OPTIONS, raw: false });
  }

  /**
   * Verifies a plaintext password against an Argon2id hash.
   * Returns false safely if verification fails or hash is malformed.
   */
  public async verify(password: string, hash: string): Promise<boolean> {
    try {
      if (!hash || !password) return false;
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Validates password strength against the canonical complexity specification:
   * - Minimum length: 10 characters
   * - At least one uppercase letter (A-Z)
   * - At least one lowercase letter (a-z)
   * - At least one digit (0-9)
   * - At least one special symbol (!@#$%^&*()_+-=[]{}|;:,.<>?)
   * - Not in common breach dictionary
   */
  public validateComplexity(password: string, isAdminRole: boolean = false): PasswordValidationResult {
    const errors: string[] = [];
    const minLength = isAdminRole ? 14 : 10;

    if (!password || typeof password !== 'string') {
      return { isValid: false, errors: ['Password must be a non-empty string.'] };
    }

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters in length.`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter (A-Z).');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter (a-z).');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one numeric digit (0-9).');
    }

    if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?).');
    }

    if (COMMON_BREACHED_PASSWORDS.has(password.toLowerCase().trim())) {
      errors.push('Password is known to be breached and is too weak. Please choose a unique password.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const passwordService = new PasswordService();
