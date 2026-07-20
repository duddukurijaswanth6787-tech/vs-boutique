import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Root Application Controller exposing default heartbeat routes.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Retrieves a simple greeting from the application service.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
