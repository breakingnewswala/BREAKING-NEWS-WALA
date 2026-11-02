/**
 * BREAKING NEWS WALA — Backup & Recovery Repository
 * Grounded in docs/15-Security.md (Section 12: Backup & Disaster Recovery)
 * and docs/DECISIONS.md (DEC-017, DEC-022)
 */

import { BackupMetadataItem, BackupRestoreTestResult } from '@bnw/types';

export interface IBackupRepository {
  createBackupRecord(item: BackupMetadataItem): Promise<BackupMetadataItem>;
  listBackups(): Promise<BackupMetadataItem[]>;
  getBackupById(id: string): Promise<BackupMetadataItem | null>;
  updateBackupRecord(id: string, updates: Partial<BackupMetadataItem>): Promise<BackupMetadataItem>;
  recordRestoreTest(result: BackupRestoreTestResult): Promise<BackupRestoreTestResult>;
  listRestoreTests(backupId?: string): Promise<BackupRestoreTestResult[]>;
}

export class InMemoryBackupRepository implements IBackupRepository {
  private backups = new Map<string, BackupMetadataItem>();
  private restoreTests: BackupRestoreTestResult[] = [];

  public async createBackupRecord(item: BackupMetadataItem): Promise<BackupMetadataItem> {
    this.backups.set(item.id, { ...item });
    return item;
  }

  public async listBackups(): Promise<BackupMetadataItem[]> {
    return Array.from(this.backups.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async getBackupById(id: string): Promise<BackupMetadataItem | null> {
    const item = this.backups.get(id);
    return item ? { ...item } : null;
  }

  public async updateBackupRecord(id: string, updates: Partial<BackupMetadataItem>): Promise<BackupMetadataItem> {
    const existing = this.backups.get(id);
    if (!existing) {
      throw new Error(`Backup record with id "${id}" not found.`);
    }
    const updated = { ...existing, ...updates };
    this.backups.set(id, updated);
    return updated;
  }

  public async recordRestoreTest(result: BackupRestoreTestResult): Promise<BackupRestoreTestResult> {
    this.restoreTests.unshift({ ...result });
    return result;
  }

  public async listRestoreTests(backupId?: string): Promise<BackupRestoreTestResult[]> {
    if (backupId) {
      return this.restoreTests.filter((t) => t.backupId === backupId);
    }
    return [...this.restoreTests];
  }

  public clear(): void {
    this.backups.clear();
    this.restoreTests = [];
  }
}

