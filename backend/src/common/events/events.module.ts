import { Global, Module } from '@nestjs/common';
import { AppEventEmitter } from './event-emitter.service';

@Global()
@Module({
  providers: [AppEventEmitter],
  exports: [AppEventEmitter],
})
export class EventsModule {}
