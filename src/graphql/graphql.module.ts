import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';

import { VehicleResolver } from './vehicle.resolver';
import { VehicleData, VehicleDataSchema } from '../database/vehicle.schema';
import { DatabaseModule } from '../database/database.module';
import { LoggerService } from '../logging/logger.service';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: VehicleData.name, schema: VehicleDataSchema },
    ]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
    }),
  ],
  providers: [VehicleResolver, LoggerService],
})
export class GraphqlModule {}
