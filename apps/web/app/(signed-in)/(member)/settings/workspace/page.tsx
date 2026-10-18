import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import { requireMember } from '@/lib/session/session.service';
import { SettingRow, SettingValues } from '../_components/setting-row';
import { LeaveWorkspaceRow } from './_components/leave-workspace-row';
import { WorkspaceSwitcherLoader } from './_components/workspace-switcher-loader';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Workspace',
  robots: { index: false, follow: false },
};

/**
 * The Workspace this device is in, in three rows: its name; Switch Workspace, to open another of
 * the person's or create one; and, last, the way to leave it. Who is in it lives in Settings →
 * Members.
 */
export default async function Workspace() {
  const session = await requireMember();

  return (
    <section className="flex flex-col">
      <SettingValues
        rows={[
          { label: 'Workspace name', value: session.membership.workspace.name },
        ]}
      />
      <SettingRow
        label="Switch Workspace"
        description="Open another of your Workspaces on this device, or create a new one."
      >
        <Suspense
          fallback={
            <Button variant="secondary" size="sm" disabled>
              Switch Workspace
            </Button>
          }
        >
          <WorkspaceSwitcherLoader membership={session.membership} />
        </Suspense>
      </SettingRow>
      <Suspense fallback={<Skeleton className="my-5 h-10 w-full" />}>
        <LeaveWorkspaceRow
          membership={session.membership}
          ownEmail={session.email}
        />
      </Suspense>
    </section>
  );
}
