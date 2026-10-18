import type { TeamSizeValue } from '../../domain/value-object/team-size.vo';

export interface WorkspaceFoundingInput {
  /** The founder's `cookie` header, opaque to everyone but the adapter. */
  readonly credential: string;
  /** Already checked by the Workspace name. */
  readonly name: string;
  readonly teamSize: TeamSizeValue | null;
}

export interface FoundedWorkspace {
  readonly workspaceId: string;
}

/**
 * Stores a new Workspace with the signed-in founder as its only Member, as Admin. The store mints
 * the Workspace's id, so it is answered here rather than chosen by the caller.
 */
export abstract class WorkspaceFounding {
  abstract found(input: WorkspaceFoundingInput): Promise<FoundedWorkspace>;
}
