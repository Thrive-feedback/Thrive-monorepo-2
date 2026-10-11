import { Text } from '@/components/atoms/text';
import type { Invitation } from '../_lib/invitation.type';

export type InvitationHeadingProps = {
  invitation: Invitation;
};

/**
 * Who invited the person, and to which Workspace, as the email said it — one part per line.
 * The spaces between the lines keep the heading's accessible name a readable sentence.
 */
export function InvitationHeading({ invitation }: InvitationHeadingProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Text variant="subtitle-handwrite-1" as="p" tone="muted">
        Do you want to join?
      </Text>
      <Text
        variant="display-5"
        as="h1"
        className="flex flex-col items-center gap-1 md:text-display-3"
      >
        {invitation.inviterName ? (
          <span className="break-words">
            “{invitation.inviterName}”{' '}
            <Text as="span" variant="subtitle-1" tone="muted">
              invited you to join
            </Text>
          </span>
        ) : (
          <Text as="span" variant="subtitle-1" tone="muted">
            You've been invited to join
          </Text>
        )}{' '}
        <span className="break-words">
          <Text
            as="span"
            variant="display-5"
            tone="brand"
            className="md:text-display-3"
          >
            “{invitation.workspaceName}”
          </Text>{' '}
          workspace
        </span>
      </Text>
    </div>
  );
}
