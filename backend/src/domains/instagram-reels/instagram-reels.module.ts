import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { AuditModule } from '@domains/audit/audit.module';
import { BullModule } from '@nestjs/bullmq';
import { InstagramReelsRepository } from './instagram-reels.repository';
import { InstagramReelsService } from './instagram-reels.service';
import { InstagramReelsAdminController } from './instagram-reels-admin.controller';
import { InstagramReelsController } from './instagram-reels.controller';
import { InstagramReelsWorker } from './instagram-reels.worker';
import { InstagramReelsQueueService } from './instagram-reels-queue.service';

const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';

const providers: any[] = [InstagramReelsRepository, InstagramReelsService];
const imports: any[] = [AuditModule];

if (isBullMQEnabled) {
  imports.push(BullModule.registerQueue({ name: 'instagram-reels' }));
  providers.push(InstagramReelsWorker, InstagramReelsQueueService);
} else {
  providers.push(InstagramReelsWorker, InstagramReelsQueueService, {
    provide: 'BullQueue_instagram-reels',
    useValue: {
      upsertJobScheduler: async () => {},
      add: async () => ({ id: randomUUID() }),
    },
  });
}

@Module({
  imports,
  controllers: [InstagramReelsAdminController, InstagramReelsController],
  providers,
  exports: [InstagramReelsService],
})
export class InstagramReelsModule {}
