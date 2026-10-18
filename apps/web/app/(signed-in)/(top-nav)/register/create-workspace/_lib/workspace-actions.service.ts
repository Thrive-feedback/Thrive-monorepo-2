'use server';

import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes.constant';
import { createWorkspaceFrom } from '@/lib/workspace/create-workspace.service';
import type { CreateWorkspaceState } from '@/lib/workspace/create-workspace-state.type';

/**
 * Creates the person's first Workspace with them as its first Admin, then moves on to Invite your
 * teammates.
 */
export async function createWorkspace(
  _previous: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const creation = await createWorkspaceFrom(formData);
  if (creation.outcome === 'refused') {
    return creation.state;
  }
  redirect(
    creation.outcome === 'created'
      ? ROUTES.register.inviteTeammates
      : creation.path,
  );
}
