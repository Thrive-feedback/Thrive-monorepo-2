'use server';

import { ApiError, unwrap } from '@repo/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { requireMemberOf } from '@/lib/session/session.service';
import {
  checkDescription,
  checkName,
  tidyName,
} from './workspace-goal-name.util';

const WorkspaceGoalId = z.uuid();
const NewWorkspaceGoal = z.object({
  name: z.string(),
  description: z.string(),
});

/** What to say when the API refused an add, by the API's error code. */
const ADD_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_MANAGE_WORKSPACE_GOALS: 'Only Admins can add Workspace Goals.',
  WORKSPACE_GOAL_NAME_TAKEN:
    'This Workspace already has that name, or had it and hid it. Show the hidden one again instead.',
  WORKSPACE_GOAL_NAME_EMPTY: 'Give it a name.',
  WORKSPACE_GOAL_NAME_HAS_SPACES: 'Use - instead of spaces.',
  WORKSPACE_GOAL_NAME_INVALID_CHARACTER: 'Use only letters, numbers, - and _.',
  WORKSPACE_GOAL_NAME_TOO_LONG: 'Keep it to 30 characters.',
  WORKSPACE_GOAL_DESCRIPTION_TOO_LONG:
    'Keep it to one sentence of 200 characters.',
};

const COULD_NOT_ADD = "We couldn't add that Workspace Goal. Please try again.";

/** What to say when the API refused a hide or a show, by the API's error code. */
const CHANGE_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_MANAGE_WORKSPACE_GOALS:
    'Only Admins can hide or show Workspace Goals.',
  WORKSPACE_GOAL_NOT_FOUND: 'That Workspace Goal is no longer here.',
  WORKSPACE_GOAL_ALREADY_HIDDEN: 'It was already hidden.',
  WORKSPACE_GOAL_ALREADY_ACTIVE: 'It was already shown.',
};

/** Where the refusal belongs: beside the name, beside the description, or over the form. */
export type AddWorkspaceGoalResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly field: 'name' | 'description' | 'form';
      readonly message: string;
    };

export type WorkspaceGoalActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

/** The refusals that are about one field, so the form shows them under it. */
function fieldOf(code: string): 'name' | 'description' | 'form' {
  if (code === 'WORKSPACE_GOAL_DESCRIPTION_TOO_LONG') {
    return 'description';
  }
  return code.startsWith('WORKSPACE_GOAL_NAME_') ? 'name' : 'form';
}

/**
 * Adds a Workspace Goal to `workspaceId`, the Workspace the page was drawn for, which must still
 * be the one the person is in. The name and description are checked again here, whatever the
 * form already checked; the API checks the rest, and that the person is an Admin.
 */
export async function addWorkspaceGoal(
  workspaceId: string,
  input: { readonly name: string; readonly description: string },
): Promise<AddWorkspaceGoalResult> {
  const parsed = NewWorkspaceGoal.safeParse(input);
  if (!parsed.success) {
    return { ok: false, field: 'form', message: COULD_NOT_ADD };
  }
  const nameRefusal = checkName(parsed.data.name);
  if (nameRefusal) {
    return { ok: false, field: 'name', message: nameRefusal };
  }
  const descriptionRefusal = checkDescription(parsed.data.description);
  if (descriptionRefusal) {
    return { ok: false, field: 'description', message: descriptionRefusal };
  }

  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  const description = parsed.data.description.trim();
  try {
    unwrap(
      await apiClient().POST('/v1/workspaces/{workspaceId}/workspace-goals', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
        },
        body: {
          name: tidyName(parsed.data.name),
          ...(description === '' ? {} : { description }),
        },
      }),
    );
    revalidatePath(ROUTES.settings.workspaceGoals);
    return { ok: true };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    if (error.code === 'NOT_SIGNED_IN') {
      redirect(ROUTES.signIn);
    }
    return {
      ok: false,
      field: fieldOf(error.code),
      message: ADD_ERRORS[error.code] ?? COULD_NOT_ADD,
    };
  }
}

/**
 * Hides or shows again one Workspace Goal of `workspaceId`, the Workspace the page was drawn for.
 * The page is drawn again either way, so the list shows where it now stands.
 */
async function changeWorkspaceGoal(
  workspaceId: string,
  workspaceGoalId: string,
  action: 'hide' | 'show',
  fallback: string,
): Promise<WorkspaceGoalActionResult> {
  const id = WorkspaceGoalId.safeParse(workspaceGoalId);
  if (!id.success) {
    return { ok: false, message: fallback };
  }
  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  const params = {
    path: { workspaceId: membership.workspace.id, workspaceGoalId: id.data },
    header: { cookie },
  };
  try {
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    if (action === 'hide') {
      await apiClient().POST(
        '/v1/workspaces/{workspaceId}/workspace-goals/{workspaceGoalId}/hide',
        { params },
      );
    } else {
      await apiClient().POST(
        '/v1/workspaces/{workspaceId}/workspace-goals/{workspaceGoalId}/show',
        { params },
      );
    }
    return { ok: true };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return { ok: false, message: CHANGE_ERRORS[error.code] ?? fallback };
  } finally {
    revalidatePath(ROUTES.settings.workspaceGoals);
  }
}

/** Hides a Workspace Goal, so Members no longer see it. */
export async function hideWorkspaceGoal(
  workspaceId: string,
  workspaceGoalId: string,
): Promise<WorkspaceGoalActionResult> {
  return changeWorkspaceGoal(
    workspaceId,
    workspaceGoalId,
    'hide',
    "We couldn't hide that Workspace Goal. Please try again.",
  );
}

/** Shows a hidden Workspace Goal again, so every Member sees it. */
export async function showWorkspaceGoal(
  workspaceId: string,
  workspaceGoalId: string,
): Promise<WorkspaceGoalActionResult> {
  return changeWorkspaceGoal(
    workspaceId,
    workspaceGoalId,
    'show',
    "We couldn't show that Workspace Goal. Please try again.",
  );
}
