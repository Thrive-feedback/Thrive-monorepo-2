import { SettingsCard } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-card';
import { MemberListSkeleton } from './member-list';

export type MemberListCardProps = {
  /** Named once it is known; the card waiting on the session says only "your Workspace". */
  workspaceName?: string;
  /** At the end of the title's row, such as Invite people for an Admin. */
  action?: React.ReactNode;
  children: React.ReactNode;
};

/** The card everyone in the Workspace is listed in, loading or not. */
export function MemberListCard({
  workspaceName,
  action,
  children,
}: MemberListCardProps) {
  return (
    <SettingsCard
      title={`Everyone in ${workspaceName ?? 'your Workspace'}`}
      description="You first, then everyone else. Those who left or were deactivated come last."
      action={action}
    >
      {children}
    </SettingsCard>
  );
}

/**
 * The Members card while the session is read, before anyone knows which Workspace it is for, or
 * whether the person may invite anybody to it.
 */
export function MemberListCardSkeleton() {
  return (
    <MemberListCard>
      <MemberListSkeleton />
    </MemberListCard>
  );
}
