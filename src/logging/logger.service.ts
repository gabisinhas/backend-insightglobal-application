import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';
import pino, { Logger as PinoLogger } from 'pino';

@Injectable({ scope: Scope.DEFAULT })
export class LoggerService implements NestLoggerService {
  private readonly logger: PinoLogger;

  constructor() {
    this.logger = pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    });
  }

  private logInternal(
    level: 'info' | 'error' | 'warn' | 'debug' | 'trace',
    message: string | Record<string, unknown>,
    trace?: string,
  ) {
    if (typeof message === 'string') {
      if (trace && level === 'error') {
        this.logger[level]({ message, trace });
      } else {
        this.logger[level](message);
      }
    } else {
      this.logger[level](message);
    }
  }

  log(message: string | Record<string, unknown>) {
    this.logInternal('info', message);
  }

  info(message: string | Record<string, unknown>) {
    this.logInternal('info', message);
  }

  error(message: string | Record<string, unknown>, trace?: string) {
    this.logInternal('error', message, trace);
  }

  warn(message: string | Record<string, unknown>) {
    this.logInternal('warn', message);
  }

  debug(message: string | Record<string, unknown>) {
    this.logInternal('debug', message);
  }

  verbose(message: string | Record<string, unknown>) {
    this.logInternal('trace', message);
  }
}
