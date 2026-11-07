import {
  CardsEmpty,
  type CardsEmptyArt,
} from '@/app/(signed-in)/(sidebar)/_components/cards-empty';
import { ComposeAction } from '@/app/(signed-in)/(sidebar)/_components/compose-action';
import type { ComposeChoice } from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import { readComposeContext } from '@/app/(signed-in)/(sidebar)/_lib/compose-context.service';
import { RECEIVED_HEADING_ID } from '@/app/(signed-in)/(sidebar)/_lib/personal-items-side.constant';
import type { ReceivedShow } from '@/lib/routes.constant';
import type { MemberAccount } from '@/lib/session/session.service';

/**
 * What an empty Received says and offers, for each kind it can be narrowed to: the one card that
 * fills it. Nothing a Member does puts Feedback here but asking for it, so asking is offered wherever
 * Feedback is missing; giving a Kudos is offered where Kudos are, the way a team starts passing them
 * round.
 */
const EMPTY: Readonly<
  Record<
    ReceivedShow,
    {
      art: CardsEmptyArt;
      title: string;
      description: string;
      choice: ComposeChoice;
    }
  >
> = {
  all: {
    art: 'every',
    title: 'No Feedback for you yet',
    description: 'When someone gives you feedback, you can read it here.',
    choice: 'ask',
  },
  requests: {
    art: 'tertiary',
    title: "You haven't asked anyone yet.",
    description:
      'Ask teammates what they think with + in the menu. Your request and every answer to it will be here.',
    choice: 'ask',
  },
  offered: {
    art: 'primary',
    title: 'Nobody has given you feedback unasked yet.',
    description:
      'When a teammate gives you feedback without being asked, you can read it here.',
    choice: 'ask',
  },
  kudos: {
    art: 'secondary',
    title: 'No Kudos for you yet.',
    description: 'When a teammate gives you kudos, you can read it here.',
    choice: 'kudos',
  },
};

export type ReceivedEmptyProps = {
  session: MemberAccount;
  /** The kind Received is narrowed to, or all of them. */
  show: ReceivedShow;
};

/**
 * Received with nothing in it, for the kind it is narrowed to, and the one card worth writing from
 * here. It is the one place Received reads who a card can be for.
 */
export async function ReceivedEmpty({ session, show }: ReceivedEmptyProps) {
  const compose = await readComposeContext(session);
  const { choice, ...empty } = EMPTY[show];

  return (
    <CardsEmpty {...empty}>
      <ComposeAction
        {...compose}
        choice={choice}
        returnFocusTo={RECEIVED_HEADING_ID}
      />
    </CardsEmpty>
  );
}
