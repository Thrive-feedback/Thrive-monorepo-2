import type { components } from '@repo/api';

/** Who else can read Feedback or a Feedback Request, as the API names it. */
export type Visibility =
  components['schemas']['OfferFeedbackRequestDto']['visibility'];
