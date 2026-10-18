import { DeactivateMemberButton } from '@/app/(signed-in)/(member)/settings/_components/deactivate-member-button';
import { readMembers } from '@/app/(signed-in)/(member)/settings/_lib/members.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { SettingRow } from '../../_components/setting-row';

export type LeaveWorkspaceRowProps = {
  membership: CurrentMembership;
  /** The signed-in person, found among the Members by the address they sign in with. */
  ownEmail: string;
};

const DESCRIPTION_ID = 'leave-workspace-description';

/**
 * Leaving, as a setting row like Sign out: Deactivating yourself, which ends your access and
 * keeps your Feedback. The only Admin cannot leave, and the row says why instead. It reads the
 * Members Members already read in this request.
 */
export async function LeaveWorkspaceRow({
  membership,
  ownEmail,
}: LeaveWorkspaceRowProps) {
  const members = await readMembers(membership);
  const self = members.find((member) => member.email === ownEmail);
  if (!self) {
    return null;
  }
  const adminCount = members.filter((member) => member.role === 'ADMIN').length;
  const isLastAdmin = self.role === 'ADMIN' && adminCount === 1;
  const workspaceName = membership.workspace.name;

  return (
    <SettingRow
      label="Leave Workspace"
      description={
        isLastAdmin
          ? `You're the only Admin of ${workspaceName}. Make someone else an Admin first to leave.`
          : `You won't be able to open ${workspaceName} again. Your Feedback stays, with “(inactive)” after your name.`
      }
      descriptionId={DESCRIPTION_ID}
    >
      <DeactivateMemberButton
        workspaceId={membership.workspace.id}
        accountId={self.accountId}
        name={self.name ?? self.email}
        workspaceName={workspaceName}
        isSelf
        disabled={isLastAdmin}
        describedById={DESCRIPTION_ID}
      />
    </SettingRow>
  );
}
