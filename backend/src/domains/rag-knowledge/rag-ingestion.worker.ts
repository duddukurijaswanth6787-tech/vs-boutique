import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RagIngestionService } from './rag-ingestion.service';
import { RagKnowledgeRepository } from './rag-knowledge.repository';

@Processor('rag-ingestion')
export class RagIngestionWorker extends WorkerHost {
  private readonly logger = new Logger(RagIngestionWorker.name);

  constructor(
    private readonly ingestionService: RagIngestionService,
    private readonly repository: RagKnowledgeRepository,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { sourceId } = job.data;
    try {
      await this.ingestionService.processIngestion(sourceId);
    } catch (err: any) {
      this.logger.error(`RAG ingestion failed for source ${sourceId}`, err.stack);
      // ponytail: service already persists FAILED in its own catch; this is a safety net for throws before that
      if (sourceId) {
        try {
          await this.repository.update(sourceId, {
            status: 'FAILED',
            error: err.message,
          });
        } catch (persistErr: any) {
          this.logger.error(`Failed to persist FAILED status for ${sourceId}`, persistErr.stack);
        }
      }
      throw err;
    }
  }
}
