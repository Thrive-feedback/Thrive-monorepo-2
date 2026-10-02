import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Deliberately says only that the process is answering. Nothing about the database,
 * nothing about a version: a probe is read by a platform that restarts what it finds
 * unhealthy, and a restart cannot fix a dependency that is down.
 */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
});

export class HealthResponseDto extends createZodDto(healthResponseSchema) {}
