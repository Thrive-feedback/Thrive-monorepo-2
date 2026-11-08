import { mayManageWorkspaceGoals } from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-access.util';
import { readWorkspaceGoals } from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goals.service';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { GoalHashtag } from './goal-hashtag';
import { WorkspaceGoalActions } from './workspace-goal-actions';

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type WorkspaceGoalListProps = {
  membership: CurrentMembership;
};

/**
 * The Workspace's Workspace Goals, one row each: the hashtag drawn as Feedback draws it, over its
 * description. An Admin sees the hidden ones too, as plain grey text with "Hidden" before the
 * description, since nothing can tag them any more, and has a menu on each to hide or show it again; anyone else reads the
 * active ones and nothing more. There is no rename
 * and no delete. It reads its own data, so the page renders around it while the read is in flight.
 */
export async function WorkspaceGoalList({
  membership,
}: WorkspaceGoalListProps) {
  const workspaceGoals = await readWorkspaceGoals(membership);
  const canManage = mayManageWorkspaceGoals(membership);

  if (workspaceGoals.length === 0) {
    return (
      <Text variant="body-2" tone="muted" className="py-4">
        {canManage
          ? 'No Workspace Goals yet. Add your first one with Add a Workspace Goal.'
          : "Your Admins haven't set any Workspace Goals yet."}
      </Text>
    );
  }

  return (
    <ul aria-label="Workspace Goals" className="flex flex-col">
      {workspaceGoals.map((workspaceGoal) => {
        const hidden = workspaceGoal.status === 'HIDDEN';
        return (
          <li
            key={workspaceGoal.id}
            className="flex items-center gap-3 border-border-subtle border-b py-4 last:border-b-0"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Text as="span" variant="subtitle-4" className="break-all">
                <GoalHashtag name={workspaceGoal.name} isHidden={hidden} />
              </Text>
              {(hidden || workspaceGoal.description) && (
                <Text as="span" variant="body-3" tone="muted">
                  {[hidden && 'Hidden', workspaceGoal.description]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              )}
            </div>
            {canManage && (
              <WorkspaceGoalActions
                workspaceId={membership.workspace.id}
                workspaceGoalId={workspaceGoal.id}
                name={workspaceGoal.name}
                isHidden={hidden}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** A `WorkspaceGoalList` still loading: a few rows of name over description. */
export function WorkspaceGoalListSkeleton() {
  return (
    <div className="flex flex-col">
      {PLACEHOLDERS.map((placeholder) => (
        <div
          key={placeholder}
          className="flex flex-col items-start gap-1 border-border-subtle border-b py-4 last:border-b-0"
        >
          <Skeleton shape="control" className="h-8 w-32 rounded-chip" />
          <Skeleton className="w-64 text-body-3" />
        </div>
      ))}
    </div>
  );
}
