import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.enableShutdownHooks();

  const port = config.PORT || 3000;
  await app.listen(port);

  logger.log(`Backend running on port ${port}`);
  logger.log(`GraphQL available at http://localhost:${port}/graphql`);
}

bootstrap();
