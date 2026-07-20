import { Injectable } from '@nestjs/common';

/**
 * Root Application Service containing core hello-world messages.
 */
@Injectable()
export class AppService {
  /**
   * Returns a standard greeting message.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
