import { AUTH, type Auth } from '@app/infrastructure/auth/auth';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { Inject, Injectable } from '@nestjs/common';
import { APIError } from 'better-auth';
import {
  type FoundedWorkspace,
  WorkspaceFounding,
  type WorkspaceFoundingInput,
} from '../../application/port/workspace-founding.port';
import { AlreadyInAWorkspaceError } from '../../application/workspace.errors';

function requestHeaders(credential: string): Headers {
  return new Headers(credential ? { cookie: credential } : {});
}

/**
 * The only file in Workspace that knows Better Auth's organization plugin exists. It creates
 * the organization on the founder's own session, so the plugin applies its limit, makes them
 * its `owner` and sets it as their active one.
 */
@Injectable()
export class BetterAuthWorkspaceFoundingAdapter extends WorkspaceFounding {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly idGenerator: IdGenerator,
  ) {
    super();
  }

  async found(input: WorkspaceFoundingInput): Promise<FoundedWorkspace> {
    try {
      const workspace = await this.auth.api.createOrganization({
        body: {
          name: input.name,
          // The plugin requires a unique slug. Thrive shows none, so it is an opaque id.
          slug: this.idGenerator.next(),
          teamSize: input.teamSize ?? undefined,
        },
        headers: requestHeaders(input.credential),
      });
      return { workspaceId: workspace.id };
    } catch (error) {
      if (this.isOrganizationLimit(error)) {
        throw new AlreadyInAWorkspaceError();
      }
      throw error;
    }
  }

  private isOrganizationLimit(error: unknown): boolean {
    return (
      error instanceof APIError &&
      error.body?.code ===
        this.auth.$ERROR_CODES
          .YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS.code
    );
  }
}
