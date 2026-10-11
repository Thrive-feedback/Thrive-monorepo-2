'use client';

import { startTransition, useActionState, useRef, useState } from 'react';
import { requestFeedback } from '@/app/(signed-in)/feedback/request/_lib/request-feedback-actions.service';
import type { RequestFeedbackState } from '@/app/(signed-in)/feedback/request/_lib/request-feedback-state.type';
import type { Teammate } from '@/app/(signed-in)/feedback/request/_lib/teammate.type';
import { Button } from '@/components/atoms/button';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { TextField } from '@/components/molecules/text-field';
import { ROUTES } from '@/lib/routes.constant';
import { MemberPicker } from './member-picker';

export type RequestFeedbackFormProps = {
  teammates: readonly Teammate[];
};

type FieldErrors = NonNullable<RequestFeedbackState['fieldErrors']>;

const PICK_SOMEONE = 'Pick who to ask.';
const ADD_A_TOPIC = 'Add a Topic.';

/**
 * Send stays enabled on an empty form on purpose: pressing it is how a person finds out what
 * is missing, and a disabled button explains nothing. Both fields stay controlled, so what was
 * picked and typed survives a refusal.
 *
 * The form is submitted by hand rather than through `action`, because React resets a form
 * after its action, which would clear the picked teammate from the page but not from state.
 */
export function RequestFeedbackForm({ teammates }: RequestFeedbackFormProps) {
  const [giverAccountId, setGiverAccountId] = useState('');
  const [topic, setTopic] = useState('');
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [state, formAction, isSending] = useActionState<
    RequestFeedbackState,
    FormData
  >(requestFeedback, {});
  const pickerRef = useRef<HTMLButtonElement>(null);
  const topicRef = useRef<HTMLInputElement>(null);

  const fieldErrors: FieldErrors = { ...state.fieldErrors, ...clientErrors };

  function handleGiverChange(accountId: string) {
    setGiverAccountId(accountId);
    setClientErrors((errors) => ({ ...errors, giverAccountId: undefined }));
  }

  function handleTopicChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTopic(event.target.value);
    setClientErrors((errors) => ({ ...errors, topic: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing: FieldErrors = {
      giverAccountId: giverAccountId === '' ? PICK_SOMEONE : undefined,
      topic: topic.trim() === '' ? ADD_A_TOPIC : undefined,
    };
    if (missing.giverAccountId || missing.topic) {
      setClientErrors(missing);
      // Focus the first field in error, in the order the page reads.
      (missing.giverAccountId ? pickerRef : topicRef).current?.focus();
      return;
    }
    setClientErrors({});
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  if (teammates.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Text variant="body-2" tone="muted">
          There is nobody to ask yet. Feedback needs at least one teammate in
          your Workspace.
        </Text>
        <Link href={ROUTES.register.inviteTeammates}>
          Invite your teammates
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <MemberPicker
        ref={pickerRef}
        teammates={teammates}
        value={giverAccountId}
        errorMessage={fieldErrors.giverAccountId}
        onChange={handleGiverChange}
      />
      <TextField
        ref={topicRef}
        label="What should they talk about?"
        name="topic"
        placeholder="e.g., my presentation at the sprint review"
        required
        value={topic}
        onChange={handleTopicChange}
        errorMessage={fieldErrors.topic}
        helperText="One Topic per request. They answer in their own words."
      />
      {state.formError && (
        <Text role="alert" variant="body-2" tone="danger">
          {state.formError}
        </Text>
      )}
      <Button
        type="submit"
        variant="primary"
        disabled={isSending}
        className="mt-2 w-full"
      >
        Send request
      </Button>
    </form>
  );
}
