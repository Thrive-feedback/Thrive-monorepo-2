import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** A flag crosses the wire as the two words a deployment sets it to, and nothing else. */
const flagValue = z.enum(['true', 'false']);

/**
 * Every flag the web reads, keyed by the variable each one is set by. That key and its string
 * value were asked for by name, so the wire says what the deployment says (ADR 0087). The key is a
 * deliberate departure from `GEN_07` R2 and from the glossary's ban on `User`; every name inside
 * the code says `showsDashboard`. Do not rename it: that is a breaking contract change (`GEN_08` R7).
 */
export const getFeatureFlagsResponseSchema = z.object({
  USER_DASHBOARD_FLAG: flagValue,
});

export class GetFeatureFlagsResponseDto extends createZodDto(
  getFeatureFlagsResponseSchema,
) {}
