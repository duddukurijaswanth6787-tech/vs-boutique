import { Injectable } from '@nestjs/common';
import { RagRepository } from './rag.repository';

export interface SyncResult {
  success: boolean;
  documentsCreated: number;
  documentsUpdated: number;
  documentsDeleted: number;
  errors: string[];
  durationMs: number;
}

export interface AdapterHealth {
  ok: boolean;
  message: string;
  documentCount?: number;
}

export interface KnowledgeSourceAdapter {
  sync(knowledgeSourceId: string): Promise<SyncResult>;
  health(knowledgeSourceId: string): Promise<AdapterHealth>;
  supportsRealtime(): boolean;
}

// ponytail: DocumentAdapter is the only concrete adapter.
// Product, Category, Brand, CMS, FAQ, Policy, Collection, Blog adapters
// are YAGNI — add when those business entities exist and need knowledge mapping.
// The adapter interface supports them with zero service changes.
@Injectable()
export class DocumentAdapter implements KnowledgeSourceAdapter {
  constructor(private readonly repository: RagRepository) {}

  async sync(knowledgeSourceId: string): Promise<SyncResult> {
    const start = Date.now();
    const errors: string[] = [];

    try {
      const source =
        await this.repository.findKnowledgeSourceById(knowledgeSourceId);
      if (!source) {
        return {
          success: false,
          documentsCreated: 0,
          documentsUpdated: 0,
          documentsDeleted: 0,
          errors: ['Knowledge source not found'],
          durationMs: Date.now() - start,
        };
      }

      // ponytail: sync for Document-type sources is a verification pass — counts document status.
      // Real re-ingestion happens via POST /documents/:id/reprocess (Phase 4).
      // When sourceType is 'DOCUMENT' or 'UPLOADED_FILE', documents are created at upload time.
      const docs =
        await this.repository.findDocumentsBySourceId(knowledgeSourceId);
      const created = docs.filter(
        (d: Record<string, unknown>) => d['status'] === 'PROCESSING',
      ).length;
      const failed = docs.filter(
        (d: Record<string, unknown>) => d['status'] === 'FAILED',
      ).length;

      await this.repository.updateKnowledgeSourceSync(knowledgeSourceId, {
        syncStatus: 'COMPLETED',
        lastSyncAt: new Date(),
        lastSyncDuration: Date.now() - start,
        documentsSynced: docs.length,
      });

      return {
        success: true,
        documentsCreated: created,
        documentsUpdated: 0,
        documentsDeleted: failed,
        errors: [],
        durationMs: Date.now() - start,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      errors.push(message);
      await this.repository
        .updateKnowledgeSourceSync(knowledgeSourceId, {
          syncStatus: 'FAILED',
          lastSyncAt: new Date(),
          lastSyncDuration: Date.now() - start,
        })
        .catch(() => {});
      return {
        success: false,
        documentsCreated: 0,
        documentsUpdated: 0,
        documentsDeleted: 0,
        errors,
        durationMs: Date.now() - start,
      };
    }
  }

  async health(knowledgeSourceId: string): Promise<AdapterHealth> {
    const source =
      await this.repository.findKnowledgeSourceById(knowledgeSourceId);
    if (!source) return { ok: false, message: 'Knowledge source not found' };
    const docs =
      await this.repository.findDocumentsBySourceId(knowledgeSourceId);
    return {
      ok: true,
      message: 'Document adapter operational',
      documentCount: docs.length,
    };
  }

  supportsRealtime(): boolean {
    return false;
  }
}
