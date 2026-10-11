'use server';

import { ApiError } from '@repo/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import type { SaveProfileState } from './save-profile-state.type';

const SaveProfileForm = z.object({
  fullName: z.string(),
  displayName: z.string(),
});

/** What to say beside a field the API refused, by the API's error code. */
const FIELD_ERRORS: Readonly<
  Record<string, { field: 'fullName' | 'displayName'; message: string }>
> = {
  FULL_NAME_EMPTY: { field: 'fullName', message: 'Enter your full name.' },
  FULL_NAME_TOO_LONG: {
    field: 'fullName',
    message: 'Use 100 characters or fewer.',
  },
  DISPLAY_NAME_EMPTY: {
    field: 'displayName',
    message: 'Enter what we should call you.',
  },
  DISPLAY_NAME_TOO_LONG: {
    field: 'displayName',
    message: 'Use 50 characters or fewer.',
  },
};

const COULD_NOT_SAVE = "We couldn't save your details. Please try again.";

/**
 * Saves what the person typed in Introduce yourself as their Profile, then moves on to
 * Create a Workspace. The API decides who is saving, from the browser's own session
 * cookie, so nobody can save a Profile for someone else.
 */
export async function saveProfile(
  _previous: SaveProfileState,
  formData: FormData,
): Promise<SaveProfileState> {
  const form = SaveProfileForm.safeParse({
    fullName: formData.get('fullName'),
    displayName: formData.get('displayName'),
  });
  if (!form.success) {
    return { formError: COULD_NOT_SAVE };
  }

  const cookie = (await headers()).get('cookie') ?? undefined;
  let next: string = ROUTES.register.createWorkspace;
  try {
    await apiClient().POST('/v1/profiles', {
      params: { header: { cookie } },
      body: form.data,
    });
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    const fieldError = FIELD_ERRORS[error.code];
    if (fieldError) {
      return { fieldErrors: { [fieldError.field]: fieldError.message } };
    }
    if (error.code === 'PROFILE_ALREADY_EXISTS') {
      // Saved already, from another tab or a second click: the step is done.
      next = ROUTES.home;
    } else if (error.code === 'NOT_SIGNED_IN') {
      next = ROUTES.signIn;
    } else {
      return { formError: COULD_NOT_SAVE };
    }
  }
  // Outside the `try`: `redirect` works by throwing, and the catch above would swallow it.
  redirect(next);
}
