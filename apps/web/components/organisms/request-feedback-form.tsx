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
import { MemberMultiPicker } from '@/components/organisms/member-multi-picker';
import { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import type {
  RequestFeedbackAction,
  RequestFeedbackState,
} from '@/lib/feedback/request-feedback-state.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { useMentionedAudience } from '@/lib/feedback/use-mentioned-audience';
import {
  ComposerLayout,
  ComposerLayoutSkeleton,
  ComposerToRow,
} from './composer-layout';
import { feedbackTagTriggers } from './feedback-tag-triggers.util';
import { VisibilityMenu } from './visibility-menu';

export type RequestFeedbackFormProps = {
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#` in the Request message. */
  workspaceGoals: readonly string[];
  /** Sends the request: Home's server action, or a stand-in. */
  action: RequestFeedbackAction;
};

type FieldErrors = NonNullable<RequestFeedbackState['fieldErrors']>;

/** Who besides the Requester and the Givers may read the answers (`ADR-0022`). */
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

const PICK_SOMEONE = 'Pick at least one person to ask.';
const WRITE_A_MESSAGE = 'Write what you would like feedback on.';
const PICK_SOMEONE_TO_SHARE_WITH = 'Pick at least one person to share it with.';

/** What the people dialog says under someone a Mention keeps selected. */
const MENTIONED = 'Mentioned in your message';

/**
 * Asking one or more teammates for Feedback with a Request message (#30), and choosing who
 * besides the Requester reads what comes back — fixed once sent.
 *
 * Send stays enabled on an empty form on purpose: pressing it is how a person finds out what
 * is missing, and a disabled button explains nothing. Every field stays controlled, so what was
 * picked and typed survives a refusal. A Workspace with nobody else in it still gets the form;
 * the picker simply has nothing to offer.
 *
 * The form is submitted by hand rather than through `action`, because React resets a form
 * after its action, which would clear the picked teammates from the page but not from state.
 */
export function RequestFeedbackForm({
  teammates,
  workspaceGoals,
  action,
}: RequestFeedbackFormProps) {
  const [giverAccountIds, setGiverAccountIds] = useState<readonly string[]>([]);
  const [message, setMessage] = useState('');
  // The Givers asked read the request whatever is chosen, so mentioning them locks nobody in.
  const audience = useMentionedAudience({
    message,
    teammates,
    readsAnyway: giverAccountIds,
  });
  const { visibility, selectedAccountIds } = audience;
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [audienceOpen, setAudienceOpen] = useState(false);
  const audienceErrorId = useId();
  const [state, formAction, isSending] = useActionState<
    RequestFeedbackState,
    FormData
  >(action, {});
  const pickerRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const fieldErrors: FieldErrors = { ...state.fieldErrors, ...clientErrors };

  // Anyone may be picked to read the answers, the people asked included: selecting one lets
  // them read the others' answers, which is the Requester's call (#30). The Requester is never
  // among `teammates`.
  const selectedOthers = teammates.filter((teammate) =>
    selectedAccountIds.has(teammate.accountId),
  );

  function handleGiversChange(accountIds: readonly string[]) {
    setGiverAccountIds(accountIds);
    setClientErrors((errors) => ({ ...errors, giverAccountIds: undefined }));
  }

  function handleMessageChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    audience.noteMessage(event.target.value);
    setMessage(event.target.value);
    setClientErrors((errors) => ({ ...errors, message: undefined }));
  }

  function handleVisibilityChange(value: Visibility) {
    audience.choose(value);
    setClientErrors((errors) => ({ ...errors, selectedAccountIds: undefined }));
  }

  function handleSelectedChange(accountIds: ReadonlySet<string>) {
    audience.select(accountIds);
    setClientErrors((errors) => ({ ...errors, selectedAccountIds: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing: FieldErrors = {
      giverAccountIds: giverAccountIds.length === 0 ? PICK_SOMEONE : undefined,
      message: message.trim() === '' ? WRITE_A_MESSAGE : undefined,
      selectedAccountIds:
        visibility === SELECTED_PEOPLE && selectedOthers.length === 0
          ? PICK_SOMEONE_TO_SHARE_WITH
          : undefined,
    };
    if (
      missing.giverAccountIds ||
      missing.message ||
      missing.selectedAccountIds
    ) {
      setClientErrors(missing);
      // Focus the first field in error, in the order the page reads. Nobody to share with opens
      // who-can-read-it, which takes focus to the people still to pick.
      if (missing.giverAccountIds) pickerRef.current?.focus();
      else if (missing.message) messageRef.current?.focus();
      else setAudienceOpen(true);
      return;
    }
    setClientErrors({});
    const formData = new FormData(event.currentTarget);
    // The choice lives in state rather than in named fields: the radios and checkboxes are
    // buttons. The people asked arrive through the picker's own hidden fields.
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
            value={giverAccountIds}
            errorMessage={fieldErrors.giverAccountIds}
            onChange={handleGiversChange}
          />
        </ComposerToRow>
      }
      message={
        <TextAreaField
          ref={messageRef}
          hideLabel
          label="What would you like feedback on?"
          name="message"
          rows={2}
          placeholder="e.g., How did my presentation at the sprint review land?"
          required
          value={message}
          triggers={feedbackTagTriggers(workspaceGoals, teammates)}
          onChange={handleMessageChange}
          errorMessage={fieldErrors.message}
          helperText="They answer in their own words."
        />
      }
      audience={
        <VisibilityMenu
          options={VISIBILITIES}
          value={visibility}
          people={teammates}
          selectedAccountIds={selectedAccountIds}
          helperText={
            <>
              {audience.notice ?? audience.lockedReason}{' '}
              {VISIBILITY_MEANS[visibility]} This can&apos;t be changed after
              you send it.
            </>
          }
          peopleDescription="You can always read what they send back."
          errorMessage={fieldErrors.selectedAccountIds}
          errorId={audienceErrorId}
          open={audienceOpen}
          onOpenChange={setAudienceOpen}
          onValueChange={handleVisibilityChange}
          onSelectedChange={handleSelectedChange}
          disabledValues={
            audience.onlyMeDisabled ? new Set(['ONLY_ME'] as const) : undefined
          }
          lockedPeople={
            new Map(
              [...audience.lockedAccountIds].map((accountId) => [
                accountId,
                MENTIONED,
              ]),
            )
          }
        />
      }
      footerError={fieldErrors.selectedAccountIds}
      footerErrorId={audienceErrorId}
      formError={state.formError}
      submit={
        <Button type="submit" variant="primary" disabled={isSending}>
          Send request
        </Button>
      }
    />
  );
}

/** A `RequestFeedbackForm` still loading, in the composer's shape. */
export function RequestFeedbackFormSkeleton() {
  return <ComposerLayoutSkeleton />;
}
