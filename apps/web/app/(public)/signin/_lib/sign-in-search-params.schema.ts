import { z } from 'zod';
import { toSignInDestination } from '@/lib/session/sign-in-destination.constant';

/**
 * `error` is set by the sign-in provider when an attempt fails. Any value means "the last
 * attempt did not finish"; a malformed one is ignored rather than trusted. `next` is where the
 * person was going when Thrive asked them to sign in, added by the proxy; anything that is not a
 * path signing in may land on is dropped here, and they land on Home.
 */
export const SignInSearchParams = z.object({
  error: z.string().optional().catch(undefined),
  next: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => toSignInDestination(value)),
});
