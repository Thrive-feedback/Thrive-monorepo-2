'use client';

import { PlusIcon } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  checkEmailList,
  parseEmailList,
} from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/email-list.util';
import { inviteMembers } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitation-actions.service';
import type {
  InviteMemberResult,
  InviteMembersState,
} from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invite-members-state.type';
import { Button } from '@/components/atoms/button';
import { DialogFooter } from '@/components/atoms/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/atoms/tabs';
import { Text } from '@/components/atoms/text';
import { TextAreaField } from '@/components/molecules/text-area-field';
import { InviteEmailRow } from '@/components/organisms/invite-email-row';
import { RoleSelect } from '@/components/organisms/role-select';
import {
  COULD_NOT_SEND_TO_ROW,
  type Invitee,
  MAX_INVITES_PER_SEND,
  roleSentTo,
} from '@/lib/invitations/invite-emails.util';
import { useInviteRows } from '@/lib/invitations/use-invite-rows';
import type { MemberRole } from '@/lib/session/current-account.type';

/** How many addresses came to each outcome, in the words of one toast. */
function summaryOf(results: readonly InviteMemberResult[]): string {
  const count = (outcome: InviteMemberResult['outcome']) =>
    results.filter((result) => result.outcome === outcome).length;
  const sent = count('invited');
  return [
    sent > 0 && `${sent} ${sent === 1 ? 'Invitation' : 'Invitations'} sent`,
    count('already_member') > 0 &&
      `${count('already_member')} already in this Workspace`,
    count('already_invited') > 0 &&
      `${count('already_invited')} already invited`,
    count('failed') > 0 && `${count('failed')} couldn't be sent`,
  ]
    .filter(Boolean)
    .join(' · ');
}

export type InviteMembersFormProps = {
  /** The Workspace the page was drawn for; sending is refused once the person is no longer in it. */
  workspaceId: string;
  /** After a send that reached every address, so whatever holds the form can put it away. */
  onSent?: () => void;
  /** Leaving without sending; draws Cancel beside Send Invitations. */
  onCancel?: () => void;
};

/**
 * Invites teammates from Members, each as an Admin or a Member (Member unless the Admin picks
 * otherwise). One by one is a row per person with their own Role, as in the register flow; Paste
 * a list is addresses typed into one box, all with the one Role beside it. Either is checked
 * before it goes, so nothing is sent while part of it is wrong.
 *
 * After a send, one toast says how it went — sent, already in, already invited, or not sent.
 * Addresses whose email could not go out stay, with their Role, so sending again retries only
 * those; the rest clear. The new Invitations appear under Invitations, which the action draws
 * again.
 */
export function InviteMembersForm({
  workspaceId,
  onSent,
  onCancel,
}: InviteMembersFormProps) {
  const [formError, setFormError] = useState<string>();
  const [isSending, startSending] = useTransition();

  /** Sends, and answers the addresses that failed, so the mode can put them back. */
  function send(
    invitations: Invitee[],
    onFailed: (failed: readonly InviteMemberResult[]) => void,
  ) {
    setFormError(undefined);
    startSending(async () => {
      const sent: InviteMembersState = await inviteMembers(
        workspaceId,
        invitations,
      );
      if ('formError' in sent) {
        setFormError(sent.formError);
        return;
      }
      const failed = sent.results.filter(
        (result) => result.outcome === 'failed',
      );
      (failed.length > 0 ? toast.error : toast.success)(
        summaryOf(sent.results),
      );
      onFailed(failed);
      if (failed.length === 0) {
        onSent?.();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="one-by-one">
        <TabsList aria-label="How to invite">
          <TabsTrigger value="one-by-one">One by one</TabsTrigger>
          <TabsTrigger value="list">Paste a list</TabsTrigger>
        </TabsList>
        <TabsContent value="one-by-one">
          <OneByOne isSending={isSending} onSend={send} onCancel={onCancel} />
        </TabsContent>
        <TabsContent value="list">
          <PasteAList isSending={isSending} onSend={send} onCancel={onCancel} />
        </TabsContent>
      </Tabs>
      {formError && (
        <Text role="alert" variant="body-2" tone="danger">
          {formError}
        </Text>
      )}
    </div>
  );
}

type ModeProps = {
  isSending: boolean;
  onSend: (
    invitations: Invitee[],
    onFailed: (failed: readonly InviteMemberResult[]) => void,
  ) => void;
  onCancel?: () => void;
};

type SendActionsProps = {
  isSending: boolean;
  /** Only One by one waits for an address before it can send. */
  isReady?: boolean;
  onCancel?: () => void;
};

/** Cancel and Send Invitations at the end of the form, as a dialog's actions sit. */
function SendActions({
  isSending,
  isReady = true,
  onCancel,
}: SendActionsProps) {
  return (
    <DialogFooter className="pt-2">
      {onCancel && (
        <Button disabled={isSending} onClick={onCancel}>
          Cancel
        </Button>
      )}
      <Button
        type="submit"
        variant="primary"
        loading={isSending}
        disabled={!isReady}
      >
        Send Invitations
      </Button>
    </DialogFooter>
  );
}

/** A row per person, each with their own Role. */
function OneByOne({ isSending, onSend, onCancel }: ModeProps) {
  const inviteRows = useInviteRows();
  const { rows } = inviteRows;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invitations = inviteRows.check();
    if (!invitations) {
      return;
    }
    onSend(invitations, (failed) =>
      inviteRows.replaceWith(
        failed.map((result) => ({
          email: result.email,
          role: roleSentTo(invitations, result.email),
          errorMessage: COULD_NOT_SEND_TO_ROW,
        })),
      ),
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
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
      {rows.length < MAX_INVITES_PER_SEND && (
        <Button
          variant="soft"
          size="sm"
          className="w-fit"
          onClick={inviteRows.add}
        >
          <PlusIcon aria-hidden="true" className="size-4" />
          Add another
        </Button>
      )}
      <SendActions
        isSending={isSending}
        isReady={inviteRows.hasAnyEmail}
        onCancel={onCancel}
      />
    </form>
  );
}

/** Addresses typed into one box, all sent with the one Role beside it. */
function PasteAList({ isSending, onSend, onCancel }: ModeProps) {
  const [text, setText] = useState('');
  const [role, setRole] = useState<MemberRole>('MEMBER');
  const [fieldError, setFieldError] = useState<string>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const list = parseEmailList(text);
    const refusal = checkEmailList(list);
    if (refusal) {
      setFieldError(refusal);
      textareaRef.current?.focus();
      return;
    }
    setFieldError(undefined);
    onSend(
      list.emails.map((email) => ({ email, role })),
      (failed) => setText(failed.map((result) => result.email).join('\n')),
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <TextAreaField
        ref={textareaRef}
        label="Email addresses"
        name="emails"
        rows={3}
        placeholder="name@company.com, another@company.com"
        required
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setFieldError(undefined);
        }}
        errorMessage={fieldError}
        helperText={`One per line or separated by commas. Up to ${MAX_INVITES_PER_SEND} at a time.`}
      />
      <div className="flex items-center gap-2">
        <Text as="span" variant="body-2">
          Invite them as
        </Text>
        <RoleSelect label="Role for everyone" value={role} onChange={setRole} />
      </div>
      <SendActions isSending={isSending} onCancel={onCancel} />
    </form>
  );
}
