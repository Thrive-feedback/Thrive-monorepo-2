/**
 * What saving the Profile answers when it does not move on. Lives apart from the action,
 * because every export of a `'use server'` file is callable from the browser.
 */
export type SaveProfileState = {
  readonly fieldErrors?: {
    readonly fullName?: string;
    readonly displayName?: string;
  };
  readonly formError?: string;
};
