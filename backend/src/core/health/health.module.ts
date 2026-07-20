import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from '@database/database.module';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { QueuesModule } from '@infrastructure/queues/queues.module';
import { HealthController } from './health.controller';

/**
 * Module responsible for orchestrating health checks across all integration layers.
 */
@Module({
  imports: [TerminusModule, DatabaseModule, RedisModule, QueuesModule],
  controllers: [HealthController],
})
export class HealthModule {}
