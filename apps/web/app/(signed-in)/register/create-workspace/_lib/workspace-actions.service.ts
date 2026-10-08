'use server';

import { ApiError } from '@repo/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import type { CreateWorkspaceState } from './create-workspace-state.type';
import { TEAM_SIZES } from './team-size.constant';

const CreateWorkspaceForm = z.object({
  workspaceName: z.string(),
  /** A browser leaves an unpicked radio group out of the form entirely. */
  teamSize: z
    .enum(TEAM_SIZES.map((size) => size.value))
    .nullable()
    .default(null),
});

/** What to say beside the name when the API refused it, by the API's error code. */
const NAME_ERRORS: Readonly<Record<string, string>> = {
  WORKSPACE_NAME_EMPTY: 'Enter a name for your Workspace.',
  WORKSPACE_NAME_TOO_LONG: 'Use 100 characters or fewer.',
};

/** Where to go instead when the API says this step is not the person's to take. */
const ELSEWHERE: Readonly<Record<string, string>> = {
  // Created already, from another tab or a second click: the step is done.
  ALREADY_IN_A_WORKSPACE: ROUTES.home,
  PROFILE_REQUIRED: ROUTES.register.introduceYourself,
  NOT_SIGNED_IN: ROUTES.signIn,
};

const COULD_NOT_CREATE = "We couldn't create your Workspace. Please try again.";

/**
 * Creates the Workspace with the person as its Owner, then moves on to Invite your
 * teammates. The API decides who is creating, from the browser's own session cookie.
 */
export async function createWorkspace(
  _previous: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const form = CreateWorkspaceForm.safeParse({
    workspaceName: formData.get('workspaceName'),
    teamSize: formData.get('teamSize') ?? undefined,
  });
  if (!form.success) {
    return { formError: COULD_NOT_CREATE };
  }

  const cookie = (await headers()).get('cookie') ?? undefined;
  let next: string = ROUTES.register.inviteTeammates;
  try {
    await apiClient().POST('/v1/workspaces', {
      params: { header: { cookie } },
      body: { name: form.data.workspaceName, teamSize: form.data.teamSize },
    });
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    const nameError = NAME_ERRORS[error.code];
    if (nameError) {
      return { fieldErrors: { workspaceName: nameError } };
    }
    const elsewhere = ELSEWHERE[error.code];
    if (!elsewhere) {
      return { formError: COULD_NOT_CREATE };
    }
    next = elsewhere;
  }
  // Outside the `try`: `redirect` works by throwing, and the catch above would swallow it.
  redirect(next);
}
