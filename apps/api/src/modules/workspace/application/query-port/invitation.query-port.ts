import type { InvitationPage } from '../types/invitation.types';
import type { PageRequest } from '../types/membership.types';

export abstract class InvitationQuery {
  /**
   * The Workspace's Invitations nobody has accepted or revoked, newest first. One whose
   * expiry has passed by `now` is answered `EXPIRED`; the store never marks it so itself.
   */
  abstract openInvitationsOfWorkspace(
    workspaceId: string,
    now: Date,
    page: PageRequest,
  ): Promise<InvitationPage>;
}
