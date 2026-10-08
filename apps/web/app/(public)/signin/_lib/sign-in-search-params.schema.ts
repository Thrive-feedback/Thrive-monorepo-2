import { z } from 'zod';

/**
 * `error` is set by the sign-in provider when an attempt fails. Any value means "the last
 * attempt did not finish"; a malformed one is ignored rather than trusted.
 */
export const SignInSearchParams = z.object({
  error: z.string().optional().catch(undefined),
});
