'use client';

import { startTransition, useActionState, useState } from 'react';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { TextAreaField } from '@/components/molecules/text-area-field';
import type {
  GiveKudosAction,
  GiveKudosState,
} from '@/lib/feedback/give-kudos-state.type';
import { kudosLength, MAX_KUDOS_LENGTH } from '@/lib/feedback/kudos-item.type';
import { mentionedTeammates } from '@/lib/feedback/mentioned-teammates.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import {
  ComposerAudienceNote,
  ComposerLayout,
  ComposerToRow,
} from './composer-layout';
import { feedbackTagTriggers } from './feedback-tag-triggers.util';

export type KudosFormProps = {
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  /** Whose Members all read it, named where the other modes offer a choice. */
  workspaceName: string;
  /** Sends the Kudos: Home's server action, or a stand-in. */
  action: GiveKudosAction;
};

/**
 * Giving Kudos: one short message that @mentions everyone it is for (brain `ADR-0043`). Nobody is
 * picked from a list — the To row fills in from the message as people are mentioned — and nobody
 * chooses who reads it: every Member of the Workspace does, which the footer says where the other
 * modes offer the choice. Send waits until the message names a teammate and fits; sending goes
 * back to Home, which says once that it went.
 *
 * The message stays controlled, so what was typed survives a refusal. The form is submitted by
 * hand rather than through `action`, because React resets a form after its action.
 */
export function KudosForm({
  teammates,
  workspaceGoals,
  workspaceName,
  action,
}: KudosFormProps) {
  const [message, setMessage] = useState('');
  const [state, formAction, isSending] = useActionState<
    GiveKudosState,
    FormData
  >(action, {});

  const recipients = mentionedTeammates(message, teammates);
  const left = MAX_KUDOS_LENGTH - kudosLength(message);
  const ready = left >= 0 && recipients.length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) {
      return;
    }
    const formData = new FormData();
    formData.set('message', message);
    startTransition(() => formAction(formData));
  }

  return (
    <ComposerLayout
      onSubmit={handleSubmit}
      to={
        <ComposerToRow>
          {recipients.length === 0 ? (
            <Text as="p" variant="body-2" tone="muted" className="pt-1.5">
              Mention who it&apos;s for with @
            </Text>
          ) : (
            <ul
              aria-label="Who it's for"
              className="flex flex-wrap gap-1.5 pt-0.5"
            >
              {recipients.map((teammate) => (
                <li key={teammate.accountId}>
                  <Badge tone="brand" size="md">
                    {teammate.name}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </ComposerToRow>
      }
      message={
        <TextAreaField
          hideLabel
          label="Your Kudos"
          name="message"
          rows={3}
          placeholder="@a teammate, and what they did well"
          required
          value={message}
          triggers={feedbackTagTriggers(workspaceGoals, teammates)}
          onChange={(event) => setMessage(event.target.value)}
          errorMessage={state.fieldErrors?.message}
        />
      }
      audience={
        <ComposerAudienceNote>Everyone in {workspaceName}</ComposerAudienceNote>
      }
      meta={
        <Text
          as="p"
          variant="body-3"
          tone={left < 0 ? 'danger' : 'muted'}
          className="tabular-nums"
        >
          {left < 0 ? `${-left} characters over` : `${left} characters left`}
        </Text>
      }
      formError={state.formError}
      submit={
        <Button type="submit" variant="primary" disabled={!ready || isSending}>
          Send Kudos
        </Button>
      }
    />
  );
}
