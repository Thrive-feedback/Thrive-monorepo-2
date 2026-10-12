/**
 * Why joining did not go through, when the page stays put to say so: the Invitation stopped
 * being Pending after the page was drawn, or something else went wrong.
 */
export type JoinWorkspaceRefusal = 'noLongerPending' | 'failed';

export type JoinWorkspaceState = {
  readonly refusal?: JoinWorkspaceRefusal;
};
