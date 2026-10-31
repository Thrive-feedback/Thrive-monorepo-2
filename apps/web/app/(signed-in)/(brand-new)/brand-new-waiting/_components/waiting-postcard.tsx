import { ApiError } from '@repo/api';
import { readWaitingPostcard } from '@/app/(signed-in)/(brand-new)/brand-new-waiting/_lib/waiting-postcard.service';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import { type BrandNewWaitingSort, ROUTES } from '@/lib/routes.constant';
import type { MemberAccount } from '@/lib/session/session.service';
import { WaitingAskGone } from './waiting-ask-gone';
import { WaitingPostcardDialog } from './waiting-postcard-dialog';

const COULD_NOT_OPEN = "Couldn't open this postcard. Try again.";

export type WaitingPostcardProps = {
  session: MemberAccount;
  askId: string;
  /** The order of the list behind it, which closing comes back to. */
  sort: BrandNewWaitingSort;
};

/** The reads, with a failure of the API told apart from an Ask there is nothing left to answer. */
async function readOpening(
  { membership, email }: MemberAccount,
  askId: string,
) {
  try {
    const [ask, teammates, workspaceGoals] = await Promise.all([
      readWaitingPostcard(membership, askId),
      readTeammates(membership, email),
      readWorkspaceGoalNames(membership),
    ]);
    return ask && { ask, teammates, workspaceGoals };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return 'failed';
  }
}

/**
 * The postcard the address names, read here so the list does not wait for it, and whatever goes
 * wrong leaves the list standing. An Ask with nothing left to answer leaves them on the list; a
 * failed read does too, saying so in a toast.
 */
export async function WaitingPostcard({
  session,
  askId,
  sort,
}: WaitingPostcardProps) {
  const closeHref = ROUTES.brandNewWaitingSorted(sort);
  const opening = await readOpening(session, askId);

  if (opening === 'failed') {
    return (
      <OneTimeToast type="error" message={COULD_NOT_OPEN} then={closeHref} />
    );
  }
  if (!opening) {
    return <WaitingAskGone askId={askId} closeHref={closeHref} />;
  }
  return (
    <WaitingPostcardDialog
      workspaceId={session.membership.workspace.id}
      askId={askId}
      closeHref={closeHref}
      ask={opening.ask}
      writer={{
        name: session.profile.displayName,
        photoUrl: session.photoUrl,
      }}
      teammates={opening.teammates}
      workspaceGoals={opening.workspaceGoals}
    />
  );
}
