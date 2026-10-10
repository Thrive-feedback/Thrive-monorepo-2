import { randomBytes } from 'node:crypto';
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
  // has to parse — but nothing here connects, serves or signs anyone in. The database is
  // never reached, an empty origin list is the honest value for a command that answers no
  // request, and the auth values are never used. So the contract regenerates on a
  // checkout with no `.env`.
  process.env.DATABASE_URL = 'postgresql://unused@127.0.0.1:1/unused';
  process.env.CORS_ALLOWED_ORIGINS = '';
  // Minted, not written down: a constant here would read as a leaked secret.
  process.env.BETTER_AUTH_SECRET = randomBytes(32).toString('base64');
  process.env.BETTER_AUTH_URL = 'http://unused.invalid';
  process.env.GOOGLE_CLIENT_ID = 'unused';
  process.env.GOOGLE_CLIENT_SECRET = 'unused';
  // Never used: no email is sent, and the transport opens no connection until one is.
  process.env.GMAIL_SMTP_USER = 'unused@unused.invalid';
  process.env.GMAIL_SMTP_APP_PASSWORD = 'unused';
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
