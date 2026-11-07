import { EyeOffIcon } from 'lucide-react';
import { mayManageWorkspaceGoals } from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-access.util';
import { hashtagOf } from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-name.util';
import { readWorkspaceGoals } from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goals.service';
import { Badge } from '@/components/atoms/badge';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { WorkspaceGoalActions } from './workspace-goal-actions';

/** Enough rows to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type WorkspaceGoalListProps = {
  membership: CurrentMembership;
};

/**
 * The Workspace's Workspace Goals, one row each: `#name` as a badge in the info blue a hashtag
 * takes everywhere, over its description. An Admin sees the hidden ones too, as a grey outline with
 * a closed eye and "Hidden", and has a menu on each to hide or show it again; anyone else reads the
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
          ? 'No Workspace Goals yet. Add your first one below.'
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
            className="flex items-center gap-3 border-border-subtle border-b py-3 last:border-b-0"
          >
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <Badge
                  size="md"
                  tone={hidden ? 'outline' : 'info'}
                  className={cn(
                    'break-all',
                    hidden ? 'text-fg-secondary' : 'text-status-info-active',
                  )}
                >
                  {hidden && (
                    <EyeOffIcon aria-hidden="true" className="size-3.5" />
                  )}
                  {hashtagOf(workspaceGoal.name)}
                </Badge>
                {hidden && (
                  <Text as="span" variant="body-3" tone="muted">
                    Hidden
                  </Text>
                )}
              </span>
              {workspaceGoal.description && (
                <Text as="span" variant="body-3" tone="muted">
                  {workspaceGoal.description}
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
          className="flex flex-col items-start gap-1 border-border-subtle border-b py-3 last:border-b-0"
        >
          <Skeleton shape="control" className="h-8 w-32 rounded-chip" />
          <Skeleton className="w-64 text-body-3" />
        </div>
      ))}
    </div>
  );
}
