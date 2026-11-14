import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Only the caller's own answer. The list it was decided from never leaves the API. */
export const getMyUiShowcaseAccessResponseSchema = z.object({
  isAllowed: z.boolean(),
});

export class GetMyUiShowcaseAccessResponseDto extends createZodDto(
  getMyUiShowcaseAccessResponseSchema,
) {}
