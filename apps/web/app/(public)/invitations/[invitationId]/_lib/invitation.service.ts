import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { apiClient } from '@/lib/api-client.service';
import type { Invitation } from './invitation.type';

/**
 * The Invitation behind a link, or `null` when no Invitation has that id. Never cached: it can
 * be accepted or revoked at any moment, and the page has to say so the next time it opens.
 */
export async function readInvitation(
  invitationId: string,
): Promise<Invitation | null> {
  try {
    const invitation = unwrap(
      await apiClient().GET('/v1/invitations/{invitationId}', {
        params: { path: { invitationId } },
        cache: 'no-store',
      }),
    );
    return {
      invitationId,
      workspaceName: invitation.workspaceName,
      inviterName: invitation.inviterName ?? null,
      invitedEmailMasked: invitation.invitedEmailMasked,
      status: invitation.status,
    };
  } catch (error) {
    if (error instanceof ApiError && error.code === 'INVITATION_NOT_FOUND') {
      return null;
    }
    throw error;
  }
}
