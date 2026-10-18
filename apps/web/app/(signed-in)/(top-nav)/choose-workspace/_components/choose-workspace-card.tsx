import NextLink from 'next/link';
import { Button } from '@/components/atoms/button';
import { Card } from '@/components/atoms/card';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import type { PendingInvitation } from '@/lib/session/pending-invitation.type';
import type { MyWorkspaces } from '@/lib/workspace/my-workspace.type';
import { WorkspaceChoices } from './workspace-choices';

export type ChooseWorkspaceCardProps = {
  workspaces: MyWorkspaces;
  invitations: readonly PendingInvitation[];
};

/**
 * The person's Workspaces to open; any Invitations waiting, each to its own page where they join;
 * and Create a Workspace, for a new one instead.
 */
export function ChooseWorkspaceCard({
  workspaces,
  invitations,
}: ChooseWorkspaceCardProps) {
  return (
    <Card
      title="Choose a Workspace"
      titleAs="h2"
      className="max-w-110 justify-self-center md:justify-self-end"
    >
      <div className="flex flex-col gap-6">
        <WorkspaceChoices workspaces={workspaces} />
        {invitations.length > 0 && (
          <section className="flex flex-col gap-2">
            <Text as="h3" variant="subtitle-4">
              Invitations waiting
            </Text>
            <ul
              aria-label="Invitations waiting for you"
              className="flex flex-col gap-2"
            >
              {invitations.map((invitation) => (
                <li
                  key={invitation.invitationId}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <Text variant="body-2" className="break-all">
                    {invitation.workspace.name}
                  </Text>
                  <Link href={ROUTES.invitation(invitation.invitationId)}>
                    See the invitation
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <Button asChild variant="outlined">
          <NextLink href={ROUTES.register.createWorkspace}>
            Create a Workspace
          </NextLink>
        </Button>
      </div>
    </Card>
  );
}
