import type { components } from '@repo/api';

/** One Workspace Goal as Settings shows it. */
export type WorkspaceGoal = {
  readonly id: string;
  /** As the Admin wrote it, without the `#`. */
  readonly name: string;
  readonly description: string | null;
  /** `HIDDEN` reaches Admins only. */
  readonly status: components['schemas']['ListWorkspaceGoalsResponseDto_Output']['items'][number]['status'];
};
