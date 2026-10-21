'use client';

import { startTransition, useActionState, useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import {
  TextField,
  TextFieldSkeleton,
} from '@/components/molecules/text-field';
import {
  MemberPicker,
  MemberPickerSkeleton,
} from '@/components/organisms/member-picker';
import {
  SELECTED_PEOPLE,
  VisibilityPicker,
  VisibilityPickerSkeleton,
} from '@/components/organisms/visibility-picker';
import type {
  RequestFeedbackAction,
  RequestFeedbackState,
} from '@/lib/feedback/request-feedback-state.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { feedbackTagTriggers } from './feedback-tag-triggers.util';

export type RequestFeedbackFormProps = {
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#` in the Topic. */
  workspaceGoals: readonly string[];
  /** Sends the request: Home's server action, or a stand-in. */
  action: RequestFeedbackAction;
};

type FieldErrors = NonNullable<RequestFeedbackState['fieldErrors']>;

/** Who besides the Requester and the Giver may read the answers (`ADR-0022`). */
const VISIBILITIES = [
  { value: 'ONLY_ME', label: 'Only me' },
  { value: SELECTED_PEOPLE, label: 'Selected people' },
  { value: 'EVERYONE', label: 'Everyone in the Workspace' },
] as const;

type Visibility = (typeof VISIBILITIES)[number]['value'];

/** What each choice means for the answers, said before the Requester commits to it. */
const VISIBILITY_MEANS: Readonly<Record<Visibility, string>> = {
  ONLY_ME: 'Only you will read what they send back.',
  SELECTED_PEOPLE: 'The people you pick can also read what they send back.',
  EVERYONE: 'Everyone in your Workspace can read what they send back.',
};

const PICK_SOMEONE = 'Pick who to ask.';
const ADD_A_TOPIC = 'Add a Topic.';
const PICK_SOMEONE_TO_SHARE_WITH = 'Pick at least one person to share it with.';

/**
 * Asking a teammate about a Topic, and choosing who besides the Requester reads what comes
 * back — fixed once sent.
 *
 * Send stays enabled on an empty form on purpose: pressing it is how a person finds out what
 * is missing, and a disabled button explains nothing. Every field stays controlled, so what was
 * picked and typed survives a refusal. A Workspace with nobody else in it still gets the form;
 * the picker simply has nothing to offer.
 *
 * The form is submitted by hand rather than through `action`, because React resets a form
 * after its action, which would clear the picked teammate from the page but not from state.
 */
export function RequestFeedbackForm({
  teammates,
  workspaceGoals,
  action,
}: RequestFeedbackFormProps) {
  const [giverAccountId, setGiverAccountId] = useState('');
  const [topic, setTopic] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('ONLY_ME');
  const [selectedAccountIds, setSelectedAccountIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [state, formAction, isSending] = useActionState<
    RequestFeedbackState,
    FormData
  >(action, {});
  const pickerRef = useRef<HTMLButtonElement>(null);
  const topicRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLFieldSetElement>(null);

  const fieldErrors: FieldErrors = { ...state.fieldErrors, ...clientErrors };

  // The Giver reads their own answer anyway, so they are not one of the people to select. The
  // Requester is never among `teammates`.
  const othersToShareWith = teammates.filter(
    (teammate) => teammate.accountId !== giverAccountId,
  );
  const selectedOthers = othersToShareWith.filter((teammate) =>
    selectedAccountIds.has(teammate.accountId),
  );

  function handleGiverChange(accountId: string) {
    setGiverAccountId(accountId);
    setClientErrors((errors) => ({ ...errors, giverAccountId: undefined }));
  }

  function handleTopicChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTopic(event.target.value);
    setClientErrors((errors) => ({ ...errors, topic: undefined }));
  }

  function handleVisibilityChange(value: Visibility) {
    setVisibility(value);
    setClientErrors((errors) => ({ ...errors, selectedAccountIds: undefined }));
  }

  function handleSelectedChange(accountId: string, selected: boolean) {
    setSelectedAccountIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(accountId);
      } else {
        next.delete(accountId);
      }
      return next;
    });
    setClientErrors((errors) => ({ ...errors, selectedAccountIds: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing: FieldErrors = {
      giverAccountId: giverAccountId === '' ? PICK_SOMEONE : undefined,
      topic: topic.trim() === '' ? ADD_A_TOPIC : undefined,
      selectedAccountIds:
        visibility === SELECTED_PEOPLE && selectedOthers.length === 0
          ? PICK_SOMEONE_TO_SHARE_WITH
          : undefined,
    };
    if (missing.giverAccountId || missing.topic || missing.selectedAccountIds) {
      setClientErrors(missing);
      // Focus the first field in error, in the order the page reads.
      if (missing.giverAccountId) pickerRef.current?.focus();
      else if (missing.topic) topicRef.current?.focus();
      else selectedRef.current?.querySelector('button')?.focus();
      return;
    }
    setClientErrors({});
    const formData = new FormData(event.currentTarget);
    // The choice lives in state rather than in named fields: the radios and checkboxes are
    // buttons, and only the people still offered — never a Giver picked since — are sent.
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
        triggers={feedbackTagTriggers(workspaceGoals, teammates)}
        onChange={handleTopicChange}
        errorMessage={fieldErrors.topic}
        helperText="One Topic per request. They answer in their own words."
      />
      <VisibilityPicker
        ref={selectedRef}
        options={VISIBILITIES}
        value={visibility}
        people={othersToShareWith}
        selectedAccountIds={selectedAccountIds}
        helperText={
          <>
            {VISIBILITY_MEANS[visibility]} This can&apos;t be changed after you
            send it.
          </>
        }
        errorMessage={fieldErrors.selectedAccountIds}
        onValueChange={handleVisibilityChange}
        onSelectedChange={handleSelectedChange}
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
        Send request
      </Button>
    </form>
  );
}

/** A `RequestFeedbackForm` still loading: who to ask, the Topic, who else reads it, and Send. */
export function RequestFeedbackFormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <MemberPickerSkeleton />
      <TextFieldSkeleton />
      <VisibilityPickerSkeleton options={VISIBILITIES} />
      <Skeleton shape="control" className="mt-2 w-32 self-end rounded-button" />
    </div>
  );
}
