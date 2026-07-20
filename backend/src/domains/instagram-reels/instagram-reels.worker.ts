import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InstagramReelsService } from './instagram-reels.service';

// ponytail: single worker handles scheduler, media health, and cleanup jobs
@Processor('instagram-reels')
@Injectable()
export class InstagramReelsWorker extends WorkerHost {
  private readonly logger = new Logger(InstagramReelsWorker.name);

  constructor(private readonly reelsService: InstagramReelsService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    switch (job.name) {
      case 'scheduler':
        return this.runScheduler();
      case 'media-health':
        return this.runMediaHealth();
      case 'storage-cleanup':
        return this.runStorageCleanup(job);
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async runScheduler() {
    this.logger.log('Scheduler job started');
    const result = await this.reelsService.runScheduler();
    this.logger.log(`Scheduler done: ${JSON.stringify(result)}`);
    return result;
  }

  private async runMediaHealth() {
    this.logger.log('Media health check started');
    const result = await this.reelsService.runMediaHealthCheck();
    this.logger.log(`Media health done: ${JSON.stringify(result)}`);
    return result;
  }

  private async runStorageCleanup(job: Job) {
    const dryRun = job.data?.dryRun !== false;
    this.logger.log(`Storage cleanup started (dryRun=${dryRun})`);
    const result = await this.reelsService.runStorageCleanup(dryRun);
    this.logger.log(
      `Storage cleanup done: ${JSON.stringify({ deleted: result.deleted, dryRun: result.dryRun })}`,
    );
    return result;
  }
}
