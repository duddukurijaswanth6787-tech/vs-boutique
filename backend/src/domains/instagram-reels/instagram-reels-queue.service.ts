import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// ponytail: registers repeatable jobs on app start. BullMQ repeat uses cron patterns.
@Injectable()
export class InstagramReelsQueueService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InstagramReelsQueueService.name);

  constructor(@InjectQueue('instagram-reels') private readonly queue: Queue) {}

  async onApplicationBootstrap() {
    try {
      await this.queue.upsertJobScheduler(
        'scheduler',
        { pattern: '* * * * *' },
        { name: 'scheduler', data: {} },
      );
      await this.queue.upsertJobScheduler(
        'media-health',
        { pattern: '0 6 * * *' },
        { name: 'media-health', data: {} },
      );
      await this.queue.upsertJobScheduler(
        'storage-cleanup',
        { pattern: '0 7 * * 0' },
        { name: 'storage-cleanup', data: { dryRun: true } },
      );
      this.logger.log(
        'Repeatable jobs registered: scheduler (* * * * *), media-health (0 6 * * *), storage-cleanup (0 7 * * 0)',
      );
    } catch {
      this.logger.warn(
        'Failed to register repeatable jobs (BullMQ may be disabled)',
      );
    }
  }
}
