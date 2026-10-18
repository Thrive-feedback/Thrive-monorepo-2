import { AUTH, type Auth } from '@app/infrastructure/auth/auth';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { Inject, Injectable } from '@nestjs/common';
import {
  type FoundedWorkspace,
  WorkspaceFounding,
  type WorkspaceFoundingInput,
} from '../../application/port/workspace-founding.port';

function requestHeaders(credential: string): Headers {
  return new Headers(credential ? { cookie: credential } : {});
}

/**
 * Creates the organization through Better Auth's organization plugin, on the founder's own
 * session, so the plugin makes them its first `admin`.
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
  }
}
