'use client';

import {
  startTransition,
  useActionState,
  useId,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/atoms/button';
import { TextAreaField } from '@/components/molecules/text-area-field';
import { chosenPeople } from '@/lib/feedback/chosen-people.util';
import type {
  GiveFeedbackAction,
  GiveFeedbackState,
} from '@/lib/feedback/give-feedback-state.type';
import {
  isWithinMessageLength,
  MAX_MESSAGE_LENGTH,
} from '@/lib/feedback/message-length.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { useMentionedAudience } from '@/lib/feedback/use-mentioned-audience';
import { ComposerLayout, ComposerToRow } from './composer-layout';
import { feedbackTagTriggers } from './feedback-tag-triggers.util';
import { MemberMultiPicker } from './member-multi-picker';
import { VisibilityMenu } from './visibility-menu';
import { SELECTED_PEOPLE } from './visibility-picker';

const names = new Intl.ListFormat('en', { type: 'conjunction' });

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

type FieldErrors = NonNullable<GiveFeedbackState['fieldErrors']>;

/**
 * Giving Feedback without being asked — Offered Feedback. The Giver picks one or more Receivers
 * from the stack of faces — one piece of Feedback they all receive, each seeing the others (brain
 * `ADR-0044`) — writes one Feedback message, and chooses who else may read it, which never changes
 * afterwards. Sending goes back to Home, which says once that it went.
 *
 * Every field stays controlled, so what was picked and typed survives a refusal. The form is
 * submitted by hand rather than through `action`, because React resets a form after its action.
 */
export function GiveFeedbackForm({
  teammates,
  workspaceGoals,
  action,
}: GiveFeedbackFormProps) {
  const [receiverAccountIds, setReceiverAccountIds] = useState<
    readonly string[]
  >([]);
  const [message, setMessage] = useState('');
  // Every Receiver reads it whatever is chosen, so mentioning them locks nobody in.
  const audience = useMentionedAudience({
    message,
    teammates,
    readsAnyway: receiverAccountIds,
  });
  const { visibility, selectedAccountIds } = audience;
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [audienceOpen, setAudienceOpen] = useState(false);
  const audienceErrorId = useId();
  const [state, formAction, isSending] = useActionState<
    GiveFeedbackState,
    FormData
  >(action, {});
  const pickerRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const errors: FieldErrors = { ...state.fieldErrors, ...clientErrors };
  const tagTriggers = feedbackTagTriggers(workspaceGoals, teammates);

  // Every Receiver always reads it, so none of them is one of the people to select.
  const othersToShareWith = teammates.filter(
    (teammate) => !receiverAccountIds.includes(teammate.accountId),
  );

  // Whoever it is for always reads it, and the dialog that picks the others says so by name.
  const receiverNames = chosenPeople(teammates, receiverAccountIds).map(
    (person) => person.name,
  );

  function handleSelectedChange(accountIds: ReadonlySet<string>) {
    audience.select(accountIds);
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
      receiverAccountIds:
        receiverAccountIds.length === 0 ? 'Pick who it is for.' : undefined,
      message:
        message.trim() === ''
          ? 'Write your feedback.'
          : !isWithinMessageLength(message)
            ? `Keep it under ${MAX_MESSAGE_LENGTH.toLocaleString('en-GB')} characters.`
            : undefined,
      selectedAccountIds:
        visibility === SELECTED_PEOPLE && selectedOthers.length === 0
          ? 'Pick at least one person to share it with.'
          : undefined,
    };
    if (found.receiverAccountIds || found.message || found.selectedAccountIds) {
      setClientErrors(found);
      // Focus the first field in error, in the order the page reads.
      if (found.receiverAccountIds) pickerRef.current?.focus();
      else if (found.message) messageRef.current?.focus();
      else setAudienceOpen(true);
      return;
    }
    setClientErrors({});
    const formData = new FormData();
    for (const accountId of receiverAccountIds) {
      formData.append('receiverAccountIds', accountId);
    }
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
    <ComposerLayout
      onSubmit={handleSubmit}
      to={
        <ComposerToRow>
          <MemberMultiPicker
            ref={pickerRef}
            teammates={teammates}
            value={receiverAccountIds}
            label="Choose who it's for"
            description="They can always read it, and see who else it's for."
            name="receiverAccountIds"
            errorMessage={errors.receiverAccountIds}
            onChange={(accountIds) => {
              setReceiverAccountIds(accountIds);
              setClientErrors((current) => ({
                ...current,
                receiverAccountIds: undefined,
              }));
            }}
          />
        </ComposerToRow>
      }
      message={
        <TextAreaField
          ref={messageRef}
          hideLabel
          label="Your feedback"
          name="message"
          rows={3}
          placeholder="What happened, what it did, and what to keep or try next time."
          required
          value={message}
          triggers={tagTriggers}
          onChange={(event) => {
            audience.noteMessage(event.target.value);
            setMessage(event.target.value);
            setClientErrors((current) => ({ ...current, message: undefined }));
          }}
          errorMessage={errors.message}
          helperText="Your name is shown with it."
        />
      }
      audience={
        <VisibilityMenu
          options={VISIBILITIES}
          value={visibility}
          people={othersToShareWith}
          selectedAccountIds={selectedAccountIds}
          helperText={
            <>
              {audience.notice ?? audience.lockedReason} This can&apos;t be
              changed after you send it.
            </>
          }
          peopleDescription={`${names.format([...(receiverNames.length > 0 ? receiverNames : ['Whoever it is for']), 'you'])} can always read it.`}
          errorMessage={errors.selectedAccountIds}
          errorId={audienceErrorId}
          open={audienceOpen}
          onOpenChange={setAudienceOpen}
          onValueChange={(value) => {
            audience.choose(value);
            setClientErrors((current) => ({
              ...current,
              selectedAccountIds: undefined,
            }));
          }}
          onSelectedChange={handleSelectedChange}
          disabledValues={
            audience.onlyMeDisabled ? new Set(['ONLY_ME'] as const) : undefined
          }
          lockedPeople={audience.lockedPeople}
        />
      }
      footerError={errors.selectedAccountIds}
      footerErrorId={audienceErrorId}
      formError={state.formError}
      submit={
        <Button type="submit" variant="primary" disabled={isSending}>
          Send feedback
        </Button>
      }
    />
  );
}
