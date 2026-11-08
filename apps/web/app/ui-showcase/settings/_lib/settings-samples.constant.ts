import type { LinkedAccount } from '@/app/(signed-in)/(sidebar)/settings/account/_lib/linked-account.type';
import type { OpenInvitation } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/open-invitation.type';
import type { WorkspaceConnection } from '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/connection.type';

/** A Discord account linked as Settings → Account would have it, with nobody signed in. */
export const SAMPLE_LINK: LinkedAccount = {
  provider: 'DISCORD',
  externalUsername: 'ann.lee',
  linkedAt: '2026-10-24T03:00:00.000Z',
};

/** A Workspace's Discord Connection as Settings → General would have it. */
export const SAMPLE_CONNECTION: WorkspaceConnection = {
  provider: 'DISCORD',
  spaceName: 'Acme HQ',
  channelName: 'feedback',
  connectedBy: 'Ann Lee',
  connectedAt: '2026-10-18T03:00:00.000Z',
};

export const SAMPLE_INVITATIONS: readonly OpenInvitation[] = [
  {
    invitationId: 'sample-invitation-pending',
    email: 'cat@acme.test',
    role: 'MEMBER',
    status: 'PENDING',
    invitedBy: 'Ann Lee',
    invitedAt: '2026-11-08T03:00:00.000Z',
    expiresAt: '2026-11-15T03:00:00.000Z',
  },
  {
    invitationId: 'sample-invitation-expired',
    email: 'dan@acme.test',
    role: 'ADMIN',
    status: 'EXPIRED',
    invitedBy: 'ben@acme.test',
    invitedAt: '2026-10-01T03:00:00.000Z',
    expiresAt: '2026-10-08T03:00:00.000Z',
  },
];
