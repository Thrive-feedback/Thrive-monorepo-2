import type {
  InvitationDetailView,
  InvitationPage,
} from '../types/invitation.types';
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

  /**
   * One Invitation, in whatever status it now stands, or `null` when no Invitation has the id.
   * A pending one whose expiry has passed by `now` is answered `EXPIRED`.
   */
  abstract invitationById(
    invitationId: string,
    now: Date,
  ): Promise<InvitationDetailView | null>;
}
