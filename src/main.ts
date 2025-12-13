import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config';
import { Logger } from '@nestjs/common';
import { IngestionService } from './ingestion/ingestion.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    app.enableShutdownHooks();
    app.enableCors();

    const port = config.PORT || 3000;

    await app.listen(port);

    logger.log(`Backend application running on port ${port}`);
    logger.log(`GraphQL available at http://localhost:${port}/graphql`);

    // --- CHAMADA DO SERVIÇO DE INGESTÃO ---
    const ingestionService = app.get(IngestionService);
    await ingestionService.ingest();
  } catch (err) {
    logger.error('Application failed to start', err instanceof Error ? err.stack : JSON.stringify(err));
    process.exit(1);
  }
}

bootstrap();
