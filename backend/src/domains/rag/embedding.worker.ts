import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmbeddingService } from './embedding.service';

// ponytail: worker exists for future Phase 4 ingestion pipeline.
// No ingestion pipeline means no jobs are enqueued yet.
@Processor('embedding-generation')
export class EmbeddingWorker extends WorkerHost {
  private readonly logger = new Logger(EmbeddingWorker.name);

  constructor(private readonly embeddingService: EmbeddingService) {
    super();
  }

  async process(
    job: Job<{ chunkId: string; text: string; model?: string }>,
  ): Promise<void> {
    const { chunkId, text } = job.data;
    this.logger.log(`Processing embedding job ${job.id} for chunk ${chunkId}`);
    await this.embeddingService.generateAndStore(text, chunkId);
    this.logger.log(`Embedding job ${job.id} completed`);
  }
}
