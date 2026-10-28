import { z } from 'zod';
import { personSchema } from './person.dto';
import { tagsSchema } from './tags.dto';

/**
 * The request a piece of Requested Feedback answers, the same on every list that shows the answer
 * (brain `ADR-0046`, `ADR-0048`). People are nested objects: a nullable name must sit below the response
 * root, because `@nestjs/swagger` reads nestjs-zod's `type: ['string', 'null']` as "array of"
 * (`docs/design/0016` §10).
 */
export const answeredRequestSchema = z.object({
  /** The Request message. */
  message: z.string(),
  /** What the Request message was bound to when it was sent. */
  tags: tagsSchema,
  requester: personSchema,
  /** Everyone the request asked, in the order they were asked, whatever became of their Ask. */
  asked: z.array(personSchema).min(1),
});
