/**
 * BREAKING NEWS WALA — KMS Credential Vault & Secret Masking
 * Grounded in docs/19-API-Pool.md, docs/20-Integrations.md, docs/15-Security.md (RULE-SEC-002)
 */

import crypto from 'crypto';
import { KmsSecretDescriptor } from '../types';

export function maskSecret(secret?: string | null): string {
  if (!secret) return 'none';
  if (secret.length <= 8) return '****';
  const prefix = secret.slice(0, 4);
  const suffix = secret.slice(-4);
  return `${prefix}...${suffix}`;
}

export class KmsCredentialVault {
  private static instance: KmsCredentialVault;
  private vaultStore: Map<string, KmsSecretDescriptor> = new Map();
  // Master key derived from environment or secure runtime fallback for local development
  private masterKey: Buffer;

  private constructor() {
    const rawMaster = process.env.KMS_MASTER_KEY || 'bnw-dev-kms-master-key-32chars!!';
    this.masterKey = crypto.createHash('sha256').update(rawMaster).digest();
  }

  public static getInstance(): KmsCredentialVault {
    if (!KmsCredentialVault.instance) {
      KmsCredentialVault.instance = new KmsCredentialVault();
    }
    return KmsCredentialVault.instance;
  }

  /**
   * Encrypts a plaintext secret into an opaque AES-256-GCM cipher envelope
   */
  public storeSecret(keyAlias: string, rawSecret: string): KmsSecretDescriptor {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    let encrypted = cipher.update(rawSecret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    const envelope = `${iv.toString('hex')}:${authTag}:${encrypted}`;
    const vaultSecretPath = `vault://kms/integrations/${keyAlias.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const descriptor: KmsSecretDescriptor = {
      keyAlias,
      vaultSecretPath,
      encryptedBytes: envelope,
      maskedValue: maskSecret(rawSecret),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.vaultStore.set(vaultSecretPath, descriptor);
    return descriptor;
  }

  /**
   * Decrypts a secret in-memory only when strictly required for an outbound API dispatch
   */
  public resolveSecret(vaultSecretPath: string): string | null {
    const descriptor = this.vaultStore.get(vaultSecretPath);
    if (!descriptor) return null;

    try {
      const [ivHex, authTagHex, encryptedHex] = descriptor.encryptedBytes.split(':');
      if (!ivHex || !authTagHex || !encryptedHex) return null;

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.masterKey,
        Buffer.from(ivHex, 'hex')
      );
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return null;
    }
  }

  /**
   * Rotates a secret by updating its plaintext payload
   */
  public rotateSecret(vaultSecretPath: string, newRawSecret: string): KmsSecretDescriptor | null {
    const existing = this.vaultStore.get(vaultSecretPath);
    if (!existing) return null;
    const updated = this.storeSecret(existing.keyAlias, newRawSecret);
    return updated;
  }

  /**
   * Revokes a secret completely from memory
   */
  public revokeSecret(vaultSecretPath: string): boolean {
    return this.vaultStore.delete(vaultSecretPath);
  }

  public getDescriptor(vaultSecretPath: string): KmsSecretDescriptor | undefined {
    return this.vaultStore.get(vaultSecretPath);
  }
}

