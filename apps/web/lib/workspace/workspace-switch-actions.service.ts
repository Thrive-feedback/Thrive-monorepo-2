'use server';

import { ApiError } from '@repo/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { createWorkspaceFrom } from '@/lib/workspace/create-workspace.service';
import type { CreateWorkspaceState } from '@/lib/workspace/create-workspace-state.type';

/**
 * Only the actions live here: every export of a `'use server'` file can be called from the
 * browser, so each checks what it was handed before using it.
 */

const WorkspaceId = z.uuid();

const Landing = z.enum(['home', 'brandNewHome']);

/** Which Home a switch lands on: the one in use, or the new one being built beside it. */
export type SwitchLanding = z.infer<typeof Landing>;

/** Each Home a switch can land on, saying once that it switched. */
const LANDINGS: Readonly<Record<SwitchLanding, string>> = {
  home: ROUTES.homeOpened,
  brandNewHome: ROUTES.brandNewHomeOpened,
};

/** What to say when the API refused a switch, by its error code. */
const SWITCH_ERRORS: Readonly<Record<string, string>> = {
  WORKSPACE_NOT_FOUND: "You're no longer in that Workspace.",
};

const COULD_NOT_SWITCH = "We couldn't switch Workspace. Please try again.";

export type SwitchWorkspaceResult = {
  readonly ok: false;
  readonly message: string;
};

/**
 * Every page shows the Workspace the person is in, and that is what just changed, so all of them
 * are drawn again.
 */
function drawEverythingAgain() {
  revalidatePath('/', 'layout');
}

/**
 * Puts this browser's session in one of the person's Workspaces — chosen after sign-in, or
 * switched to from Settings or the new Home's navbar — and opens the Home named by `landing`,
 * every page drawn afresh, saying once that it switched. Other devices stay where they are. The
 * API checks they are in it. Answers only when it could not switch.
 */
export async function switchWorkspace(
  workspaceId: string,
  landing: SwitchLanding = 'home',
): Promise<SwitchWorkspaceResult> {
  const id = WorkspaceId.safeParse(workspaceId);
  const destination = Landing.safeParse(landing);
  if (!id.success || !destination.success) {
    return { ok: false, message: COULD_NOT_SWITCH };
  }
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    await apiClient().POST('/v1/workspaces/{workspaceId}/switch', {
      params: { path: { workspaceId: id.data }, header: { cookie } },
    });
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    if (error.code === 'NOT_SIGNED_IN') {
      redirect(ROUTES.signIn);
    }
    return {
      ok: false,
      message: SWITCH_ERRORS[error.code] ?? COULD_NOT_SWITCH,
    };
  }
  drawEverythingAgain();
  // Outside the `try`: `redirect` works by throwing, and the catch above would swallow it.
  redirect(LANDINGS[destination.data]);
}

/**
 * Creates another Workspace from the switcher, with the person as its first Admin; their session
 * goes into it, and they land on its Home.
 */
export async function createAnotherWorkspace(
  _previous: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const creation = await createWorkspaceFrom(formData);
  if (creation.outcome === 'refused') {
    return creation.state;
  }
  if (creation.outcome === 'elsewhere') {
    redirect(creation.path);
  }
  drawEverythingAgain();
  redirect(ROUTES.home);
}
