import type { Workspace } from '../entity/workspace.entity';

export abstract class WorkspaceRepository {
  /** The Workspace with all of its Members. */
  abstract findById(id: string): Promise<Workspace | null>;

  /**
   * A Workspace the Account is a Member of, with all of its Members, or `null` while it
   * belongs to none. Today an Account belongs to at most one.
   */
  abstract findByMemberAccount(accountId: string): Promise<Workspace | null>;

  /** Stores a newly founded Workspace with its Members. */
  abstract save(workspace: Workspace): Promise<void>;
}
