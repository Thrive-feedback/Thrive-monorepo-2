import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Text } from '@/components/atoms/text';
import { requireMember } from '@/lib/session/session.service';
import { AddWorkspaceGoalForm } from './_components/add-workspace-goal-form';
import {
  WorkspaceGoalList,
  WorkspaceGoalListSkeleton,
} from './_components/workspace-goal-list';
import { mayManageWorkspaceGoals } from './_lib/workspace-goal-access.util';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Workspace Goals',
  robots: { index: false, follow: false },
};

/**
 * What the Workspace cares about, as hashtags. Every Member reads the active ones with what each
 * means; Admins also see the hidden ones, hide and show them, and add more below the list. The
 * pane is already headed Workspace Goals, so the list needs no heading of its own.
 */
export default async function WorkspaceGoals() {
  const session = await requireMember();
  const canManage = mayManageWorkspaceGoals(session.membership);

  return (
    <section className="flex flex-col">
      <Text variant="body-2" tone="muted" className="pt-5">
        What {session.membership.workspace.name} cares about, as hashtags.
      </Text>
      <Suspense fallback={<WorkspaceGoalListSkeleton />}>
        <WorkspaceGoalList membership={session.membership} />
      </Suspense>
      {canManage && (
        <section className="flex flex-col gap-3 border-border-subtle border-t py-5">
          <Text as="h3" variant="subtitle-4">
            Add a Workspace Goal
          </Text>
          <AddWorkspaceGoalForm workspaceId={session.membership.workspace.id} />
        </section>
      )}
    </section>
  );
}
