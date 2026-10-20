'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import {
  hideWorkspaceGoal,
  showWorkspaceGoal,
  type WorkspaceGoalActionResult,
} from '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goal-actions.service';
import { hashtagOf } from '@/app/(signed-in)/(member)/settings/workspace-goals/_lib/workspace-goal-name.util';
import { Button } from '@/components/atoms/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';

type ChangeWorkspaceGoalButtonProps = {
  workspaceId: string;
  workspaceGoalId: string;
  name: string;
  label: string;
  Icon: typeof EyeIcon;
  doneMessage: string;
  onChange: (
    workspaceId: string,
    workspaceGoalId: string,
  ) => Promise<WorkspaceGoalActionResult>;
};

/**
 * An icon button that hides or shows one Workspace Goal at once, without asking: either can be
 * undone with the other, and nothing is lost. A toast says it is done, since the row only
 * changes once the page is drawn again.
 */
function ChangeWorkspaceGoalButton({
  workspaceId,
  workspaceGoalId,
  name,
  label,
  Icon,
  doneMessage,
  onChange,
}: ChangeWorkspaceGoalButtonProps) {
  const [isChanging, startChanging] = useTransition();
  const accessibleName = `${label} ${hashtagOf(name)}`;

  function handleClick() {
    startChanging(async () => {
      const result = await onChange(workspaceId, workspaceGoalId);
      if (result.ok) {
        toast.success(doneMessage);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={accessibleName}
          loading={isChanging}
          onClick={handleClick}
        >
          {!isChanging && <Icon aria-hidden="true" className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export type WorkspaceGoalButtonProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  workspaceGoalId: string;
  /** Without the `#`. */
  name: string;
};

/** Hides an active Workspace Goal, so Members no longer see it. Its name stays taken. */
export function HideWorkspaceGoalButton(props: WorkspaceGoalButtonProps) {
  return (
    <ChangeWorkspaceGoalButton
      {...props}
      label="Hide"
      Icon={EyeOffIcon}
      doneMessage={`${hashtagOf(props.name)} is hidden`}
      onChange={hideWorkspaceGoal}
    />
  );
}

/** Shows a hidden Workspace Goal again, so every Member sees it. */
export function ShowWorkspaceGoalButton(props: WorkspaceGoalButtonProps) {
  return (
    <ChangeWorkspaceGoalButton
      {...props}
      label="Show"
      Icon={EyeIcon}
      doneMessage={`${hashtagOf(props.name)} is shown again`}
      onChange={showWorkspaceGoal}
    />
  );
}
