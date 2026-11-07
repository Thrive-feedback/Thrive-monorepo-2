import { z } from 'zod';
import { tagsSchema } from './tags.dto';

/** An answer to an Ask on the wire: what its Giver wrote, and when. */
export const answerSchema = z.object({
  message: z.string(),
  /** What its Giver wrote was bound to when it was sent. */
  tags: tagsSchema,
  answeredAt: z.iso.datetime({ offset: true }),
});
