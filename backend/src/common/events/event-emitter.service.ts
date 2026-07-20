import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class AppEventEmitter {
  private emitter = new EventEmitter();

  emit(event: string, payload?: Record<string, unknown>): void {
    this.emitter.emit(event, payload);
  }

  on(event: string, handler: (...args: any[]) => any): void {
    this.emitter.on(event, handler);
  }

  removeListener(event: string, handler: (...args: any[]) => any): void {
    this.emitter.removeListener(event, handler);
  }
}
