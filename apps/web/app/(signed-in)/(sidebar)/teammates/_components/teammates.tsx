import { toSessionWriter } from '@/app/(signed-in)/(sidebar)/_lib/postcard-writer.util';
import { Skeleton, SkeletonRegion } from '@/components/atoms/skeleton';
import {
  readTeammates,
  readWorkspaceMembers,
} from '@/lib/feedback/teammates.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import type { MemberAccount } from '@/lib/session/session.service';
import { TeammatesDirectory } from './teammates-directory';

export type TeammatesProps = {
  session: MemberAccount;
};

/**
 * Everyone in the person's Workspace, them included, read here so the page renders around the list,
 * with the Workspace Goals `#` offers on a card opened from it.
 */
export async function Teammates({ session }: TeammatesProps) {
  const { membership, email } = session;
  // Both from one read of the Workspace: who is listed, and who a card can be for, which is
  // everyone but the person, as every other card in the app decides it.
  const [people, teammates, workspaceGoals] = await Promise.all([
    readWorkspaceMembers(membership),
    readTeammates(membership, email),
    readWorkspaceGoalNames(membership),
  ]);

  return (
    <TeammatesDirectory
      people={people}
      teammates={teammates}
      workspaceId={membership.workspace.id}
      workspaceName={membership.workspace.name}
      workspaceGoals={workspaceGoals}
      writer={toSessionWriter(session)}
      isAdmin={membership.role === 'ADMIN'}
    />
  );
}

/** `Teammates` still loading: the search field, then rows of face, name over email, and actions. */
export function TeammatesSkeleton() {
  return (
    <SkeletonRegion>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-11 w-full rounded-control" />
        <div className="flex flex-col divide-y divide-border-subtle rounded-page border border-border-muted px-4 md:px-6">
          {['first', 'second', 'third', 'fourth'].map((row) => (
            <div
              key={row}
              className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:gap-6"
            >
              <div className="flex flex-1 items-center gap-2">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <Skeleton className="h-9 w-full md:w-52" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
