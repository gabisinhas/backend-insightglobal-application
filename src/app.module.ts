import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { IngestionModule } from './ingestion/ingestion.module';
import { HealthModule } from './health/health.module';
import { GraphqlModule } from './graphql/graphql.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI!, {
      dbName: 'vehicles',
    }),
    DatabaseModule,
    IngestionModule,
    GraphqlModule,
    HealthModule,
  ],
})
export class AppModule {}
