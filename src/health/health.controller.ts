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
      this.logger.info({
        message: 'HealthController: Health check passed',
        healthStatus: JSON.stringify(healthStatus),
      });
      return healthStatus;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);

      this.logger.error({
        message: 'HealthController: Health check failed',
        errorMessage: errorMessage || 'Unknown error',
      });
      throw error;
    }
  }
}
