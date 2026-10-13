'use client';

import { useRef, useState, useTransition } from 'react';
import {
  checkEmailList,
  MAX_INVITES_PER_SEND,
  parseEmailList,
} from '@/app/(signed-in)/(member)/settings/members/_lib/email-list.util';
import { inviteMembers } from '@/app/(signed-in)/(member)/settings/members/_lib/invitation-actions.service';
import type { InviteMemberResult } from '@/app/(signed-in)/(member)/settings/members/_lib/invite-members-state.type';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { TextAreaField } from '@/components/molecules/text-area-field';

/** How each outcome reads beside its address. */
const OUTCOME_TEXT: Readonly<Record<InviteMemberResult['outcome'], string>> = {
  invited: 'Invitation sent',
  already_member: 'is already in this Workspace',
  already_invited: 'already has a pending Invitation',
  failed: "Couldn't send",
};

/**
 * Each outcome in its status colour. The words carry the same meaning, so nothing depends on
 * seeing the colour.
 */
const OUTCOME_COLOUR: Readonly<Record<InviteMemberResult['outcome'], string>> =
  {
    invited: 'text-status-success',
    already_member: 'text-status-info',
    already_invited: 'text-status-warning',
    failed: 'text-status-error',
  };

/**
 * Invites teammates from Members: addresses typed into one box, sent together. The list is
 * checked before it goes, so nothing is sent while part of it is wrong.
 *
 * After a send the box empties, except for addresses whose email could not go out, which stay
 * so sending again retries only those. What happened to each address is listed underneath and
 * announced politely; the new Invitations appear under Open invitations, which the action draws
 * again.
 */
export function InviteMembersForm() {
  const [text, setText] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [results, setResults] = useState<readonly InviteMemberResult[]>([]);
  const [isSending, startSending] = useTransition();
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
    setFormError(undefined);
    startSending(async () => {
      const sent = await inviteMembers(list.emails);
      if ('formError' in sent) {
        setFormError(sent.formError);
        return;
      }
      setResults(sent.results);
      setText(
        sent.results
          .filter((result) => result.outcome === 'failed')
          .map((result) => result.email)
          .join('\n'),
      );
    });
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
      {formError && (
        <Text role="alert" variant="body-2" tone="danger">
          {formError}
        </Text>
      )}
      <Button
        type="submit"
        variant="primary"
        loading={isSending}
        className="w-fit"
      >
        Send invites
      </Button>
      <div aria-live="polite">
        {results.length > 0 && (
          <ul aria-label="What happened" className="flex flex-col gap-2">
            {results.map((result) => (
              <li key={result.email} className="flex flex-col">
                <Text as="span" variant="body-2" className="break-all">
                  {result.email}
                </Text>
                <Text
                  as="span"
                  variant="body-3"
                  className={OUTCOME_COLOUR[result.outcome]}
                >
                  {OUTCOME_TEXT[result.outcome]}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}
