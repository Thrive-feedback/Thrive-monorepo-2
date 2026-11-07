import {
  type PersonalView,
  type ReceivedShow,
  ROUTES,
} from '@/lib/routes.constant';

/** Which of a Member's own lists: what was written to them, or what they wrote. */
export type PersonalItemsSide = 'received' | 'given';

/** Given's title, for focus to go to when what held it is gone. */
export const GIVEN_HEADING_ID = 'given-heading';

/**
 * Where each list lives, for the parts both draw. Only Received is narrowed to one kind, so Given
 * takes what it is showing and has nothing to keep of it.
 */
export const PERSONAL_ITEMS_ROUTES: Readonly<
  Record<
    PersonalItemsSide,
    {
      viewing: (view: PersonalView, show: ReceivedShow) => string;
      feedback: (
        feedbackId: string,
        view: PersonalView,
        show: ReceivedShow,
      ) => string;
    }
  >
> = {
  received: {
    viewing: ROUTES.receivedViewing,
    feedback: ROUTES.receivedFeedback,
  },
  given: {
    viewing: (view) => ROUTES.givenViewing(view),
    feedback: (feedbackId, view) => ROUTES.givenFeedback(feedbackId, view),
  },
};
