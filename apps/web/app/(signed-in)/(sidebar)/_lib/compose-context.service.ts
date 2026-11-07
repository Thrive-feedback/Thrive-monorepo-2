import 'server-only';
import { toSessionWriter } from '@/app/(signed-in)/(sidebar)/_lib/postcard-writer.util';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import type { MemberAccount } from '@/lib/session/session.service';

/** What a card written from a page needs: where it goes, who it can be for, and who is writing it. */
export type ComposeContext = {
  readonly workspaceId: string;
  readonly teammates: readonly Teammate[];
  readonly workspaceGoals: readonly string[];
  readonly writer: PostcardWriter;
};

/** Reads what a card written from this page needs, both lists at once. */
export async function readComposeContext(
  session: MemberAccount,
): Promise<ComposeContext> {
  const { membership, email } = session;
  const [teammates, workspaceGoals] = await Promise.all([
    readTeammates(membership, email),
    readWorkspaceGoalNames(membership),
  ]);
  return {
    workspaceId: membership.workspace.id,
    teammates,
    workspaceGoals,
    writer: toSessionWriter(session),
  };
}
