import { DeactivateMemberButton } from '@/app/(signed-in)/(sidebar)/settings/_components/deactivate-member-button';
import {
  SettingRow,
  SettingRowSkeleton,
} from '@/app/(signed-in)/(sidebar)/settings/_components/setting-row';
import { readMembers } from '@/app/(signed-in)/(sidebar)/settings/_lib/members.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type LeaveWorkspaceRowProps = {
  membership: CurrentMembership;
  /** The signed-in person, found among the Members by the address they sign in with. */
  ownEmail: string;
};

const LABEL = 'Leave Workspace';
const DESCRIPTION_ID = 'leave-workspace-description';

/**
 * Leaving, as a setting row like Sign out: Deactivating yourself, which ends your access and
 * keeps your Feedback. The only Admin cannot leave: the button still presses, and says why in a
 * dialog rather than on the row. It reads the Members Members already read in this request.
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
      label={LABEL}
      description={
        isLastAdmin
          ? undefined
          : `You won't be able to open ${workspaceName} again. The Feedback you gave and received stays, with “(inactive)” after your name.`
      }
      descriptionId={DESCRIPTION_ID}
    >
      <DeactivateMemberButton
        workspaceId={membership.workspace.id}
        accountId={self.accountId}
        name={self.name ?? self.email}
        workspaceName={workspaceName}
        isSelf
        isLastAdmin={isLastAdmin}
        describedById={isLastAdmin ? undefined : DESCRIPTION_ID}
      />
    </SettingRow>
  );
}

/** `LeaveWorkspaceRow` while the Members are read: its label, and what it will say in grey. */
export function LeaveWorkspaceRowSkeleton() {
  return <SettingRowSkeleton label={LABEL} />;
}
