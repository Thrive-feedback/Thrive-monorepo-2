/**
 * What creating the Workspace answers when it does not move on. Lives apart from the
 * action, because every export of a `'use server'` file is callable from the browser.
 */
export type CreateWorkspaceState = {
  readonly fieldErrors?: {
    readonly workspaceName?: string;
  };
  readonly formError?: string;
};
