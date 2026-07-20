import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';

@ApiTags('Monitoring')
@Controller('health/metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ApiBearerAuth()
export class MonitoringController {
  private readonly enabled: boolean;

  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly configService: ConfigService,
  ) {
    this.enabled = this.configService.get<boolean>(
      'app.monitoring.enabled',
      true,
    );
  }

  @Get()
  getMetrics(): Record<string, unknown> {
    if (!this.enabled) {
      throw new NotFoundException('Monitoring is disabled');
    }
    return this.monitoringService.getSnapshot();
  }
}
