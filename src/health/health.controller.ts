import { Controller, Get } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';

@Controller('health')
export class HealthController {
  constructor(private readonly logger: LoggerService) {}

  @Get()
  check() {
    this.logger.info('HealthController: Health check endpoint called');
    try {
      const healthStatus = {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
      this.logger.info('HealthController: Health check passed', healthStatus);
      return healthStatus;
    } catch (error) {
      this.logger.error('HealthController: Health check failed', error.stack);
      throw error;
    }
  }
}
