import { AUTH, type Auth } from '@app/infrastructure/auth/auth';
import { Inject, Injectable } from '@nestjs/common';
import { SessionWorkspace } from '../../application/port/session-workspace.port';

function requestHeaders(credential: string): Headers {
  return new Headers(credential ? { cookie: credential } : {});
}

/**
 * Keeps the session's Workspace in the organization plugin's `session.activeOrganizationId`,
 * read and written on the caller's own session, as every other plugin call here is. The plugin
 * already sets it when a Workspace is created or an Invitation accepted through it.
 */
@Injectable()
export class BetterAuthSessionWorkspaceAdapter extends SessionWorkspace {
  constructor(@Inject(AUTH) private readonly auth: Auth) {
    super();
  }

  async selectedIn(credential: string): Promise<string | null> {
    const session = await this.auth.api.getSession({
      headers: requestHeaders(credential),
    });
    return session?.session.activeOrganizationId ?? null;
  }

  async select(credential: string, workspaceId: string): Promise<void> {
    await this.auth.api.setActiveOrganization({
      body: { organizationId: workspaceId },
      headers: requestHeaders(credential),
    });
  }
}
