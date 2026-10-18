import 'server-only';
import { ApiError } from '@repo/api';
import { headers } from 'next/headers';
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
  PROFILE_REQUIRED: ROUTES.register.introduceYourself,
  NOT_SIGNED_IN: ROUTES.signIn,
};

const COULD_NOT_CREATE = "We couldn't create your Workspace. Please try again.";

/** What sending the form came to: created, refused where the form says why, or sent elsewhere. */
export type WorkspaceCreation =
  | { readonly outcome: 'created' }
  | { readonly outcome: 'refused'; readonly state: CreateWorkspaceState }
  | { readonly outcome: 'elsewhere'; readonly path: string };

/**
 * Creates a Workspace from its form, with the person as its first Admin; the API makes it the one
 * they are in, and decides who is creating from the browser's own session cookie. Where to go
 * next is the caller's, since a first Workspace and another one move on to different pages.
 */
export async function createWorkspaceFrom(
  formData: FormData,
): Promise<WorkspaceCreation> {
  const form = CreateWorkspaceForm.safeParse({
    workspaceName: formData.get('workspaceName'),
    teamSize: formData.get('teamSize') ?? undefined,
  });
  if (!form.success) {
    return { outcome: 'refused', state: { formError: COULD_NOT_CREATE } };
  }

  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    await apiClient().POST('/v1/workspaces', {
      params: { header: { cookie } },
      body: { name: form.data.workspaceName, teamSize: form.data.teamSize },
    });
    return { outcome: 'created' };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    const nameError = NAME_ERRORS[error.code];
    if (nameError) {
      return {
        outcome: 'refused',
        state: { fieldErrors: { workspaceName: nameError } },
      };
    }
    const elsewhere = ELSEWHERE[error.code];
    return elsewhere
      ? { outcome: 'elsewhere', path: elsewhere }
      : { outcome: 'refused', state: { formError: COULD_NOT_CREATE } };
  }
}
