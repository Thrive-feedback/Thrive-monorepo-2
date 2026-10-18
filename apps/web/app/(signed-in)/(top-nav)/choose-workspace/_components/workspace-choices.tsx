'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { WorkspaceList } from '@/components/organisms/workspace-list';
import type { MyWorkspaces } from '@/lib/workspace/my-workspace.type';
import { switchWorkspace } from '@/lib/workspace/workspace-switch-actions.service';

export type WorkspaceChoicesProps = {
  workspaces: MyWorkspaces;
};

/**
 * Choosing one opens its Home in this browser's session; nothing is in a Workspace before that,
 * so nothing is asked first. The choices are disabled while it is on its way.
 */
export function WorkspaceChoices({ workspaces }: WorkspaceChoicesProps) {
  const [isChoosing, startChoosing] = useTransition();

  function handleChoose(workspaceId: string) {
    startChoosing(async () => {
      const result = await switchWorkspace(workspaceId);
      toast.error(result.message);
    });
  }

  return (
    <WorkspaceList
      workspaces={workspaces}
      disabled={isChoosing}
      onChoose={handleChoose}
    />
  );
}
