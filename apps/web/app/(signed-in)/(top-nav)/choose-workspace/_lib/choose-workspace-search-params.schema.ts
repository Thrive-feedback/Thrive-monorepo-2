import { z } from 'zod';

/**
 * `signedIn=1` is kept on the address when signing in led here, so the page can say once that
 * they are signed in. Any other value is ignored.
 */
export const ChooseWorkspaceSearchParams = z.object({
  signedIn: z.literal('1').optional().catch(undefined),
});
