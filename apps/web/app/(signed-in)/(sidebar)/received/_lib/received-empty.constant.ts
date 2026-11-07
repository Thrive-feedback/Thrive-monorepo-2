import type { CardsEmptyArt } from '@/app/(signed-in)/(sidebar)/_components/cards-empty';
import type { ComposeChoice } from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import type { ReceivedShow } from '@/lib/routes.constant';

/**
 * What an empty Received says and offers, for each kind it can be narrowed to. Nothing a Member does
 * puts Feedback here but asking for it, so asking is offered wherever Feedback is missing. Feedback
 * given unasked also offers giving some, the way it starts going round a team; Kudos offers giving a
 * Kudos.
 */
export const RECEIVED_EMPTY: Readonly<
  Record<
    ReceivedShow,
    {
      art: CardsEmptyArt;
      title: string;
      description: string;
      /** The cards worth writing from here, in the order they are offered. */
      choices: readonly ComposeChoice[];
    }
  >
> = {
  all: {
    art: 'every',
    title: 'No Feedback for you yet',
    description: 'When someone gives you feedback, you can read it here.',
    choices: ['ask'],
  },
  requests: {
    art: 'tertiary',
    title: "You haven't asked anyone yet.",
    description:
      'Ask teammates what they think with + in the menu. Your request and every answer to it will be here.',
    choices: ['ask'],
  },
  offered: {
    art: 'primary',
    title: 'Nobody has given you feedback unasked yet.',
    description:
      'When a teammate gives you feedback without being asked, you can read it here. You can give a teammate feedback unasked too.',
    choices: ['ask', 'give'],
  },
  kudos: {
    art: 'secondary',
    title: 'No Kudos for you yet.',
    description: 'When a teammate gives you kudos, you can read it here.',
    choices: ['kudos'],
  },
};
