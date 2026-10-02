import { z } from 'zod';

/**
 * The shape of every environment variable this application reads, parsed once at boot.
 *
 * Nothing here defaults a secret, and no default weakens production. A new entry ships
 * with its `.env.example` line in the same change.
 */
export const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),

  DATABASE_URL: z
    .url()
    .refine(
      (url) => ['postgres:', 'postgresql:'].includes(new URL(url).protocol),
      'Must be a PostgreSQL URL',
    ),
});

export type Environment = z.infer<typeof environmentSchema>;
