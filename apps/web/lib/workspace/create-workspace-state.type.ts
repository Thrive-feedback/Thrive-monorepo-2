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

/** Creates the Workspace from its form; where it goes once created is the action's to decide. */
export type CreateWorkspaceAction = (
  previous: CreateWorkspaceState,
  formData: FormData,
) => Promise<CreateWorkspaceState>;
