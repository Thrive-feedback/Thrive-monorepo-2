import {
  cursorQueryShape,
  cursorResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { WAITING_ASK_SORTS } from '../../application/types/feedback-request.types';
import { feedbackAskSchema } from './get-feedback-ask.dto';
import { postcardSchema } from './postcard.dto';

export const listWaitingAsksQuerySchema = z.strictObject({
  /** Which Asks come first: the newest unless the caller says otherwise. */
  sort: z.enum(WAITING_ASK_SORTS).default('NEWEST'),
  ...cursorQueryShape,
});
export class ListWaitingAsksQueryDto extends createZodDto(
  listWaitingAsksQuerySchema,
) {}

/** One Ask waiting on the caller, on the card it was sent on. */
const waitingAskSchema = feedbackAskSchema.extend({
  /** How the request looks, or `null` when it was not written on a postcard. */
  postcard: postcardSchema.nullable(),
});

export const listWaitingAsksResponseSchema = z.object({
  /** The caller's own Asks still waiting, in that order. Whose they are is never a parameter. */
  items: z.array(waitingAskSchema),
  ...cursorResultShape,
});
export class ListWaitingAsksResponseDto extends createZodDto(
  listWaitingAsksResponseSchema,
) {}
