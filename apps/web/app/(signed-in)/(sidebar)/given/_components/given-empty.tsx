import { CardsEmpty } from '@/app/(signed-in)/(sidebar)/_components/cards-empty';
import { ComposeAction } from '@/app/(signed-in)/(sidebar)/_components/compose-action';
import { readComposeContext } from '@/app/(signed-in)/(sidebar)/_lib/compose-context.service';
import { GIVEN_HEADING_ID } from '@/app/(signed-in)/(sidebar)/_lib/personal-items-side.constant';
import type { MemberAccount } from '@/lib/session/session.service';

export type GivenEmptyProps = {
  session: MemberAccount;
};

/**
 * Given with nothing in it, drawn as an empty Received is, and the one way to put something there:
 * giving Feedback. It is the one place Given reads who a card can be for.
 */
export async function GivenEmpty({ session }: GivenEmptyProps) {
  const compose = await readComposeContext(session);

  return (
    <CardsEmpty art="every" title="You haven't given any Feedback yet.">
      <ComposeAction
        {...compose}
        choice="give"
        returnFocusTo={GIVEN_HEADING_ID}
      />
    </CardsEmpty>
  );
}
