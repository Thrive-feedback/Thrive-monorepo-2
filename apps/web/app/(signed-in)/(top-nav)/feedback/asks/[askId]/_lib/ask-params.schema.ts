import { z } from 'zod';

/** The dynamic segment, checked before it is used: anything else is not an Ask of ours. */
export const AskParams = z.object({
  askId: z.uuid(),
});
