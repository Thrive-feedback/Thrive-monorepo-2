import { z } from 'zod';

/** The dynamic segment, checked before it is used: anything else is not a request of ours. */
export const RequestParams = z.object({
  requestId: z.uuid(),
});
