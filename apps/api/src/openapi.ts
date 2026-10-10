import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

/**
 * The OpenAPI document is *generated from* the API app, never hand-written.
 * `cleanupOpenApiDoc` resolves the zod schemas the DTOs declared, so every route's types
 * reach the specification without a second description of the same shapes.
 *
 * Built here rather than in `main.ts` because two callers need it: the running app serves
 * it at `/openapi.json`, and `scripts/emit-openapi.ts` writes it to disk for the generator.
 */
export function buildOpenApiDocument(
  app: INestApplication,
): ReturnType<typeof cleanupOpenApiDoc> {
  return cleanupOpenApiDoc(
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Thrive API')
        .setDescription('Thrive — an employee feedback platform.')
        .setVersion('1.0')
        // One tag per Nest module, so the reference groups routes the way the code owns them.
        // A controller's `@ApiTags` names its module; a tag listed here and nowhere else is unused.
        .addTag(
          'identity',
          'Who is signed in, their session and their Profile.',
        )
        .addTag('workspace', 'Workspaces, their Members and their Invitations.')
        .addTag('app', 'The application itself, such as its health.')
        .build(),
    ),
  );
}
