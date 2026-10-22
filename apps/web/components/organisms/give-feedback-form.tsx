'use client';

import { startTransition, useActionState, useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { TextAreaField } from '@/components/molecules/text-area-field';
import type {
  GiveFeedbackAction,
  GiveFeedbackState,
} from '@/lib/feedback/give-feedback-state.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { feedbackTagTriggers } from './feedback-tag-triggers.util';
import { MemberPicker } from './member-picker';
import { SELECTED_PEOPLE, VisibilityPicker } from './visibility-picker';

export type GiveFeedbackFormProps = {
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#` in the Feedback message. */
  workspaceGoals: readonly string[];
  /** Sends the Feedback: Home's server action, or a stand-in. */
  action: GiveFeedbackAction;
};

/**
 * Who besides the Giver and the Receiver may read Offered Feedback (`ADR-0022`). "Only them" is
 * the Giver's name for the audience a Requester calls "Only me": nobody besides the two of them.
 */
const VISIBILITIES = [
  { value: 'ONLY_ME', label: 'Only them' },
  { value: SELECTED_PEOPLE, label: 'Selected people' },
  { value: 'EVERYONE', label: 'Everyone in the Workspace' },
] as const;

type Visibility = (typeof VISIBILITIES)[number]['value'];

type FieldErrors = NonNullable<GiveFeedbackState['fieldErrors']>;

/** As long as the API lets a Feedback message be. */
const MAX_MESSAGE_LENGTH = 4000;

/**
 * Giving Feedback without being asked — Offered Feedback. The Giver picks the Receiver, writes
 * one Feedback message, and chooses who else may read it, which never changes afterwards. Sending
 * goes back to Home, which says once that it went.
 *
 * Every field stays controlled, so what was picked and typed survives a refusal. The form is
 * submitted by hand rather than through `action`, because React resets a form after its action.
 */
export function GiveFeedbackForm({
  teammates,
  workspaceGoals,
  action,
}: GiveFeedbackFormProps) {
  const [receiverAccountId, setReceiverAccountId] = useState('');
  const [message, setMessage] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('ONLY_ME');
  const [selectedAccountIds, setSelectedAccountIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [state, formAction, isSending] = useActionState<
    GiveFeedbackState,
    FormData
  >(action, {});
  const pickerRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const selectedRef = useRef<HTMLFieldSetElement>(null);

  const errors: FieldErrors = { ...state.fieldErrors, ...clientErrors };
  const tagTriggers = feedbackTagTriggers(workspaceGoals, teammates);

  // The Receiver always reads it, so they are not one of the people to select.
  const othersToShareWith = teammates.filter(
    (teammate) => teammate.accountId !== receiverAccountId,
  );

  function toggleSelected(accountId: string, checked: boolean) {
    setSelectedAccountIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(accountId);
      } else {
        next.delete(accountId);
      }
      return next;
    });
    setClientErrors((current) => ({
      ...current,
      selectedAccountIds: undefined,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedOthers = othersToShareWith.filter((teammate) =>
      selectedAccountIds.has(teammate.accountId),
    );
    const found: FieldErrors = {
      receiverAccountId:
        receiverAccountId === '' ? 'Pick who it is for.' : undefined,
      message:
        message.trim() === ''
          ? 'Write your feedback.'
          : message.trim().length > MAX_MESSAGE_LENGTH
            ? `Keep it under ${MAX_MESSAGE_LENGTH} characters.`
            : undefined,
      selectedAccountIds:
        visibility === SELECTED_PEOPLE && selectedOthers.length === 0
          ? 'Pick at least one person to share it with.'
          : undefined,
    };
    if (found.receiverAccountId || found.message || found.selectedAccountIds) {
      setClientErrors(found);
      // Focus the first field in error, in the order the page reads.
      if (found.receiverAccountId) pickerRef.current?.focus();
      else if (found.message) messageRef.current?.focus();
      else selectedRef.current?.querySelector('button')?.focus();
      return;
    }
    setClientErrors({});
    const formData = new FormData();
    formData.set('receiverAccountId', receiverAccountId);
    formData.set('message', message);
    formData.set('visibility', visibility);
    if (visibility === SELECTED_PEOPLE) {
      for (const teammate of selectedOthers) {
        formData.append('selectedAccountIds', teammate.accountId);
      }
    }
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <MemberPicker
        ref={pickerRef}
        label="Who is it for?"
        name="receiverAccountId"
        teammates={teammates}
        value={receiverAccountId}
        errorMessage={errors.receiverAccountId}
        onChange={(accountId) => {
          setReceiverAccountId(accountId);
          setClientErrors((current) => ({
            ...current,
            receiverAccountId: undefined,
          }));
        }}
      />
      <TextAreaField
        ref={messageRef}
        label="Your feedback"
        name="message"
        rows={5}
        placeholder="What happened, what it did, and what to keep or try next time."
        required
        value={message}
        triggers={tagTriggers}
        onChange={(event) => {
          setMessage(event.target.value);
          setClientErrors((current) => ({ ...current, message: undefined }));
        }}
        errorMessage={errors.message}
        helperText="Your name is shown with it."
      />
      <VisibilityPicker
        ref={selectedRef}
        options={VISIBILITIES}
        value={visibility}
        people={othersToShareWith}
        selectedAccountIds={selectedAccountIds}
        helperText="This can't be changed after you send it."
        errorMessage={errors.selectedAccountIds}
        onValueChange={(value) => {
          setVisibility(value);
          setClientErrors((current) => ({
            ...current,
            selectedAccountIds: undefined,
          }));
        }}
        onSelectedChange={toggleSelected}
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
        className="mt-2 self-end"
      >
        Send feedback
      </Button>
    </form>
  );
}
