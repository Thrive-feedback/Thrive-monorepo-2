import { readMyWorkspaces } from '@/app/(signed-in)/(member)/settings/workspace/_lib/my-workspaces.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { WorkspaceSwitcher } from './workspace-switcher';

export type WorkspaceSwitcherLoaderProps = {
  membership: CurrentMembership;
};

/**
 * Reads the person's Workspaces for the switcher. Keyed on the Workspace they are in, so after a
 * switch the dialog is drawn afresh, closed.
 */
export async function WorkspaceSwitcherLoader({
  membership,
}: WorkspaceSwitcherLoaderProps) {
  const workspaces = await readMyWorkspaces();

  return (
    <WorkspaceSwitcher
      key={membership.workspace.id}
      currentWorkspaceId={membership.workspace.id}
      workspaces={workspaces}
    />
  );
}
