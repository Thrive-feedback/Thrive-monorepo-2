import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { buildOpenApiDocument } from '../src/openapi';

/**
 * The document is a property of the route metadata, not of a running server, so the app
 * is created and closed without ever listening. ADR 0006 records why the file is
 * committed: a checkout regenerates the client without starting the API.
 */
async function emit(): Promise<void> {
  // Nest creates the app's providers while reading route metadata, so the configuration
  // has to parse — but nothing here connects or serves. The database is never reached,
  // and an empty origin list is the honest value for a command that answers no request.
  process.env.DATABASE_URL = 'postgresql://unused@127.0.0.1:1/unused';
  process.env.CORS_ALLOWED_ORIGINS = '';
  const app = await NestFactory.create(AppModule, { logger: false });
  const target = resolve(__dirname, '..', 'openapi.json');

  try {
    await writeFile(
      target,
      `${JSON.stringify(buildOpenApiDocument(app), null, 2)}\n`,
      'utf8',
    );
  } finally {
    await app.close();
  }

  process.stdout.write(`openapi.json written to ${target}\n`);
}

void emit();
