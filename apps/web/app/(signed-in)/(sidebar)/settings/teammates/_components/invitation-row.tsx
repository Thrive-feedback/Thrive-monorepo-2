import {
  INVITATION_STATUS_NAMES,
  INVITATION_STATUS_TONES,
} from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitation-status.constant';
import type { OpenInvitation } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/open-invitation.type';
import { StatusText } from '@/components/atoms/status-text';
import { Text } from '@/components/atoms/text';
import { InvitationActions } from './invitation-actions';

export type InvitationRowProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  invitation: OpenInvitation;
};

/**
 * One open Invitation: the address and where it stands, with its menu beside it. The Role, who
 * sent it, when, and when it expires wait behind Information in that menu, so the list reads as
 * who was invited and nothing more.
 */
export function InvitationRow({ workspaceId, invitation }: InvitationRowProps) {
  return (
    <li className="flex items-center gap-3 border-border-subtle border-b py-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Text as="span" variant="subtitle-4" className="break-all">
          {invitation.email}
        </Text>
        <Text as="span" variant="body-3">
          <StatusText tone={INVITATION_STATUS_TONES[invitation.status]}>
            {INVITATION_STATUS_NAMES[invitation.status]}
          </StatusText>
        </Text>
      </div>
      <InvitationActions workspaceId={workspaceId} invitation={invitation} />
    </li>
  );
}
