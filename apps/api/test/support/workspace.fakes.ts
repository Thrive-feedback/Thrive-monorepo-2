import { HasProfilePort } from '@app/modules/identity';
import {
  type FoundedWorkspace,
  WorkspaceFounding,
  type WorkspaceFoundingInput,
} from '@app/modules/workspace/application/port/workspace-founding.port';
import { AlreadyInAWorkspaceError } from '@app/modules/workspace/application/workspace.errors';

/**
 * Remembers each Workspace it was asked to found, and answers the ids it was given. Like the
 * real store, it refuses a credential whose founder already has one.
 */
export class FakeWorkspaceFounding extends WorkspaceFounding {
  readonly founded: WorkspaceFoundingInput[] = [];
  /** Credentials whose founder is already a Member of a Workspace. */
  readonly alreadyMembers = new Set<string>();
  private readonly ids: string[];

  constructor(...ids: string[]) {
    super();
    this.ids = ids;
  }

  async found(input: WorkspaceFoundingInput): Promise<FoundedWorkspace> {
    if (this.alreadyMembers.has(input.credential)) {
      throw new AlreadyInAWorkspaceError();
    }
    const workspaceId = this.ids.shift();
    if (workspaceId === undefined) {
      throw new Error('FakeWorkspaceFounding ran out of ids.');
    }
    this.founded.push(input);
    return { workspaceId };
  }
}

/** Answers from the Accounts the test says have introduced themselves. */
export class FakeHasProfilePort extends HasProfilePort {
  readonly introduced = new Set<string>();

  async hasProfile(accountId: string): Promise<boolean> {
    return this.introduced.has(accountId);
  }
}
