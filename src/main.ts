import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.enableShutdownHooks();

  const port = config?.PORT ?? 4001;
  await app.listen(port);

  console.log(`Backend running on port ${port}`);
  console.log(`GraphQL available at http://localhost:${port}/graphql`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
