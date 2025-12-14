import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';

import { IngestionModule } from './ingestion/ingestion.module';
import { HealthModule } from './health/health.module';
import { GraphqlModule } from './graphql/graphql.module';
import { DatabaseModule } from './database/database.module';
import { LoggerService } from './logging/logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>('LOG_LEVEL', 'info'),
          transport:
            configService.get<string>('NODE_ENV') === 'development'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    singleLine: true,
                  },
                }
              : undefined,
        },
      }),
    }),

    ScheduleModule.forRoot(),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: 'vehicles',
      }),
    }),

    DatabaseModule,
    IngestionModule,
    GraphqlModule,
    HealthModule,
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logger: LoggerService) {}

  onModuleInit() {
    this.logger.info('AppModule: Application has started');
  }

  onModuleDestroy() {
    this.logger.info('AppModule: Application is shutting down');
  }
}
