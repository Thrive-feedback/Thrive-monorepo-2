import { EyeOffIcon } from 'lucide-react';
import { mayManageWorkspaceGoals } from '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goal-access.util';
import { hashtagOf } from '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goal-name.util';
import { readWorkspaceGoals } from '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goals.service';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import {
  HideWorkspaceGoalButton,
  ShowWorkspaceGoalButton,
} from './change-workspace-goal-button';

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type WorkspaceGoalListProps = {
  membership: CurrentMembership;
};

/**
 * The Workspace's Workspace Goals, one row each: `#name` over its description. An Admin sees the
 * hidden ones too, greyed with a closed eye and "Hidden", and can hide each active one or show
 * each hidden one again; anyone else reads the active ones and nothing more. There is no rename
 * and no delete. It reads its own data, so the page renders around it while the read is in flight.
 */
export async function WorkspaceGoalList({
  membership,
}: WorkspaceGoalListProps) {
  const workspaceGoals = await readWorkspaceGoals(membership);
  const canManage = mayManageWorkspaceGoals(membership);

  if (workspaceGoals.length === 0) {
    return (
      <Text variant="body-2" tone="muted" className="py-5">
        {canManage
          ? 'No Workspace Goals yet. Add your first one below.'
          : "Your Admins haven't set any Workspace Goals yet."}
      </Text>
    );
  }

  return (
    <ul aria-label="Workspace Goals" className="flex flex-col py-2">
      {workspaceGoals.map((workspaceGoal) => {
        const hidden = workspaceGoal.status === 'HIDDEN';
        return (
          <li
            key={workspaceGoal.id}
            className="flex items-center gap-3 border-border-subtle border-b py-3 last:border-b-0"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <Text
                as="span"
                variant="subtitle-4"
                tone={hidden ? 'muted' : 'default'}
                className="flex items-center gap-1.5 break-all"
              >
                {hidden && <EyeOffIcon aria-hidden="true" className="size-4" />}
                {hashtagOf(workspaceGoal.name)}
                {hidden && (
                  <Text as="span" variant="body-3" tone="muted">
                    (Hidden)
                  </Text>
                )}
              </Text>
              {workspaceGoal.description && (
                <Text as="span" variant="body-3" tone="muted">
                  {workspaceGoal.description}
                </Text>
              )}
            </div>
            {canManage &&
              (hidden ? (
                <ShowWorkspaceGoalButton
                  workspaceId={membership.workspace.id}
                  workspaceGoalId={workspaceGoal.id}
                  name={workspaceGoal.name}
                />
              ) : (
                <HideWorkspaceGoalButton
                  workspaceId={membership.workspace.id}
                  workspaceGoalId={workspaceGoal.id}
                  name={workspaceGoal.name}
                />
              ))}
          </li>
        );
      })}
    </ul>
  );
}

/** A `WorkspaceGoalList` still loading: a few rows of name over description. */
export function WorkspaceGoalListSkeleton() {
  return (
    <div className="flex flex-col py-2">
      {PLACEHOLDERS.map((placeholder) => (
        <div
          key={placeholder}
          className="flex flex-col border-border-subtle border-b py-3 last:border-b-0"
        >
          <Skeleton className="w-32 text-subtitle-4" />
          <Skeleton className="w-64 text-body-3" />
        </div>
      ))}
    </div>
  );
}
