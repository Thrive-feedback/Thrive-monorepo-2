'use client';

import { InfoIcon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { sendInvitations } from '@/app/(signed-in)/(top-nav)/register/invite-teammates/_lib/invitation-actions.service';
import type { InviteResult } from '@/app/(signed-in)/(top-nav)/register/invite-teammates/_lib/invite-teammates-state.type';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { InviteEmailRow } from '@/components/organisms/invite-email-row';
import { useInviteRows } from '@/lib/invitations/use-invite-rows';
import { ROUTES } from '@/lib/routes.constant';
import { InviteResults } from './invite-results';

/** The API invites at most this many people per send. */
const MAX_ROW_COUNT = 10;

const COULD_NOT_SEND_TO_ROW = "Couldn't send. Try again.";

/**
 * One person per row, each with the Role they join with, Member unless the founder picks Admin.
 * Rows are checked as `useInviteRows` describes.
 *
 * Send is disabled until a row holds an address, so there is always someone to invite. A
 * flagged row refuses the whole send rather than sending the rest, so nobody is told their
 * invites went out while some are still waiting to be fixed.
 *
 * Each address is answered on its own. One whose email could not go out stays in its row with
 * its Role, flagged, and the rest leave the form, so sending again retries only those. Once none
 * is left, the form gives way to what happened to every address.
 */
export type InviteTeammatesFormProps = {
  /** The Workspace just created; sending is refused once the person is no longer in it. */
  workspaceId: string;
};

export function InviteTeammatesForm({ workspaceId }: InviteTeammatesFormProps) {
  const router = useRouter();
  const inviteRows = useInviteRows();
  const { rows } = inviteRows;
  const [formError, setFormError] = useState<string>();
  const [settled, setSettled] = useState<readonly InviteResult[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [isSending, startSending] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invitations = inviteRows.check();
    if (!invitations) {
      return;
    }
    setFormError(undefined);
    startSending(async () => {
      const sent = await sendInvitations(workspaceId, invitations);
      if ('formError' in sent) {
        setFormError(sent.formError);
        return;
      }
      const failed = sent.results.filter((r) => r.outcome === 'failed');
      setSettled((earlier) => [
        ...earlier,
        ...sent.results.filter((r) => r.outcome !== 'failed'),
      ]);
      if (failed.length === 0) {
        setIsDone(true);
        return;
      }
      inviteRows.replaceWith(
        failed.map((result) => ({
          email: result.email,
          role:
            invitations.find(
              (i) => i.email.toLowerCase() === result.email.toLowerCase(),
            )?.role ?? 'MEMBER',
          errorMessage: COULD_NOT_SEND_TO_ROW,
        })),
      );
    });
  }

  function handleContinue() {
    router.push(ROUTES.home);
  }

  function handleSkip() {
    router.push(ROUTES.home);
  }

  if (isDone) {
    return <InviteResults results={settled} onContinue={handleContinue} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-3">
        <Text as="legend" variant="subtitle-4" className="mb-2">
          Email address
        </Text>
        {/* Scrolls past about five rows. The padding, offset by the negative margin, keeps a
            focused field's ring inside the area instead of clipped at its edge. */}
        <div className="-m-1 flex max-h-72 flex-col gap-3 overflow-y-auto p-1">
          {rows.map((row, index) => (
            <InviteEmailRow
              key={row.id}
              ref={inviteRows.inputRef(row.id)}
              label={`Email address ${index + 1}`}
              value={row.value}
              role={row.role}
              errorMessage={row.errorMessage}
              isRemovable={rows.length > 1}
              onChange={(value) => inviteRows.changeEmail(row.id, value)}
              onRoleChange={(role) => inviteRows.changeRole(row.id, role)}
              onBlur={() => inviteRows.leave(row.id)}
              onRemove={() => inviteRows.remove(row.id)}
            />
          ))}
        </div>
        {rows.length < MAX_ROW_COUNT && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={inviteRows.add}
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            Add another
          </Button>
        )}
        <div className="flex items-start gap-2 text-fg-secondary">
          <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <Text variant="body-2" tone="muted">
            You can invite up to {MAX_ROW_COUNT} now
            <br />
            invite more anytime from Settings.
          </Text>
        </div>
      </fieldset>
      {formError && (
        <Text role="alert" variant="body-2" tone="danger">
          {formError}
        </Text>
      )}
      <Button
        type="submit"
        variant="primary"
        disabled={!inviteRows.hasAnyEmail || isSending}
        className="mt-2 w-full"
      >
        {isSending ? 'Sending…' : 'Send invites & Done'}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        disabled={isSending}
        onClick={handleSkip}
      >
        Skip &amp; Done
      </Button>
    </form>
  );
}
