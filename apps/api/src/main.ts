import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

import { AppModule } from './app.module';
import { HttpConfig } from './config/configuration';
import { buildOpenApiDocument } from './openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const http = app.get(HttpConfig);

  // Without this, a provider's `onModuleDestroy` never runs on SIGTERM, so the database
  // connections stay open on the server's side of every restart and deploy.
  app.enableShutdownHooks();

  // Only the origins configured for this environment. A browser calling from anywhere
  // else is refused, which is the point: the list is the allowlist.
  app.enableCors({ origin: [...http.allowedOrigins] });

  const document = buildOpenApiDocument(app);

  SwaggerModule.setup('openapi', app, document, {
    jsonDocumentUrl: 'openapi.json',
  });
  // The sidebar lists each route by its path, which is how people look one up; the summary
  // stays on the route's own page.
  app.use(
    '/reference',
    apiReference({ content: document, operationTitleSource: 'path' }),
  );

  await app.listen(http.port);
}

void bootstrap();
