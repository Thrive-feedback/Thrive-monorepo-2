import { ROUTES } from '@/lib/routes.constant';

/** Which of a Member's own lists: what was written to them, or what they wrote. */
export type PersonalItemsSide = 'received' | 'given';

/** Given's title, for focus to go to when what held it is gone. */
export const GIVEN_HEADING_ID = 'given-heading';

/** Where each list lives, for the parts both draw. */
export const PERSONAL_ITEMS_ROUTES = {
  received: {
    viewing: ROUTES.brandNewReceivedViewing,
    feedback: ROUTES.brandNewReceivedFeedback,
  },
  given: {
    viewing: ROUTES.brandNewGivenViewing,
    feedback: ROUTES.brandNewGivenFeedback,
  },
} as const;
