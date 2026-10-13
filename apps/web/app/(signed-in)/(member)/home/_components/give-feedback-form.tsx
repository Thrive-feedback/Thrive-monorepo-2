'use client';

import { useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Teammate } from '@/app/(signed-in)/(member)/home/_lib/teammate.type';
import { Button } from '@/components/atoms/button';
import { Checkbox } from '@/components/atoms/checkbox';
import { Label } from '@/components/atoms/label';
import { RadioGroup, RadioGroupItem } from '@/components/atoms/radio-group';
import { Text } from '@/components/atoms/text';
import { TextAreaField } from '@/components/molecules/text-area-field';
import { TextField } from '@/components/molecules/text-field';
import { MemberPicker } from './member-picker';

export type GiveFeedbackFormProps = {
  teammates: readonly Teammate[];
};

/** Who besides the Giver and the Receiver may read Offered Feedback (`ADR-0022`). */
const VISIBILITIES = [
  { value: 'ONLY_THEM', label: 'Only them' },
  { value: 'SELECTED_PEOPLE', label: 'Selected people' },
  { value: 'EVERYONE', label: 'Everyone in the Workspace' },
] as const;

type Visibility = (typeof VISIBILITIES)[number]['value'];

type FieldErrors = {
  readonly receiverAccountId?: string;
  readonly topic?: string;
  readonly body?: string;
  readonly selectedAccountIds?: string;
};

/** As long as an answer to an Ask may be. */
const MAX_BODY_LENGTH = 4000;

const PREVIEW_ONLY =
  'Preview only: Give feedback isn’t connected yet, so nothing was sent.';

/**
 * Giving Feedback without being asked — Offered Feedback. The Giver picks the Receiver, a Topic,
 * writes one answer, and chooses who else may read it, which never changes afterwards.
 *
 * Not connected: the API cannot take Offered Feedback yet. Sending checks the form as the real
 * one will, then says nothing was sent and clears it.
 */
export function GiveFeedbackForm({ teammates }: GiveFeedbackFormProps) {
  const [receiverAccountId, setReceiverAccountId] = useState('');
  const [topic, setTopic] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('ONLY_THEM');
  const [selectedAccountIds, setSelectedAccountIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const [errors, setErrors] = useState<FieldErrors>({});
  const pickerRef = useRef<HTMLButtonElement>(null);
  const topicRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const selectedRef = useRef<HTMLFieldSetElement>(null);
  const visibilityLabelId = useId();
  const selectedMessageId = useId();

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
    setErrors((current) => ({ ...current, selectedAccountIds: undefined }));
  }

  function reset() {
    setReceiverAccountId('');
    setTopic('');
    setBody('');
    setVisibility('ONLY_THEM');
    setSelectedAccountIds(new Set());
    setErrors({});
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedOthers = othersToShareWith.filter((teammate) =>
      selectedAccountIds.has(teammate.accountId),
    );
    const found: FieldErrors = {
      receiverAccountId:
        receiverAccountId === '' ? 'Pick who it is for.' : undefined,
      topic: topic.trim() === '' ? 'Add a Topic.' : undefined,
      body:
        body.trim() === ''
          ? 'Write your feedback.'
          : body.trim().length > MAX_BODY_LENGTH
            ? `Keep it under ${MAX_BODY_LENGTH} characters.`
            : undefined,
      selectedAccountIds:
        visibility === 'SELECTED_PEOPLE' && selectedOthers.length === 0
          ? 'Pick at least one person to share it with.'
          : undefined,
    };
    if (
      found.receiverAccountId ||
      found.topic ||
      found.body ||
      found.selectedAccountIds
    ) {
      setErrors(found);
      // Focus the first field in error, in the order the page reads.
      if (found.receiverAccountId) pickerRef.current?.focus();
      else if (found.topic) topicRef.current?.focus();
      else if (found.body) bodyRef.current?.focus();
      else selectedRef.current?.querySelector('button')?.focus();
      return;
    }
    toast.info(PREVIEW_ONLY, { id: PREVIEW_ONLY });
    reset();
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
          setErrors((current) => ({
            ...current,
            receiverAccountId: undefined,
          }));
        }}
      />
      <TextField
        ref={topicRef}
        label="What is it about?"
        name="topic"
        placeholder="e.g., the customer demo on Tuesday"
        required
        value={topic}
        onChange={(event) => {
          setTopic(event.target.value);
          setErrors((current) => ({ ...current, topic: undefined }));
        }}
        errorMessage={errors.topic}
      />
      <TextAreaField
        ref={bodyRef}
        label="Your feedback"
        name="body"
        rows={5}
        placeholder="What happened, what it did, and what to keep or try next time."
        required
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          setErrors((current) => ({ ...current, body: undefined }));
        }}
        errorMessage={errors.body}
        helperText="Your name is shown with it."
      />
      <div className="flex flex-col gap-2">
        <Text as="span" id={visibilityLabelId} variant="label">
          Who else can read it?
        </Text>
        <RadioGroup
          aria-labelledby={visibilityLabelId}
          value={visibility}
          onValueChange={(value) => {
            setVisibility(value as Visibility);
            setErrors((current) => ({
              ...current,
              selectedAccountIds: undefined,
            }));
          }}
        >
          {VISIBILITIES.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={option.value}
                id={`${visibilityLabelId}-${option.value}`}
              />
              <Label htmlFor={`${visibilityLabelId}-${option.value}`}>
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <Text as="p" variant="caption" tone="muted">
          This can&apos;t be changed after you send it.
        </Text>
      </div>
      {visibility === 'SELECTED_PEOPLE' && (
        <fieldset
          ref={selectedRef}
          aria-describedby={
            errors.selectedAccountIds ? selectedMessageId : undefined
          }
          className="flex flex-col gap-2 rounded-element border border-border-subtle p-3"
        >
          <Text as="legend" variant="label" className="px-1">
            Share it with
          </Text>
          {othersToShareWith.length === 0 ? (
            <Text variant="body-2" tone="muted">
              Nobody else is in your Workspace yet.
            </Text>
          ) : (
            othersToShareWith.map((teammate) => {
              const id = `${visibilityLabelId}-share-${teammate.accountId}`;
              return (
                <div
                  key={teammate.accountId}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id={id}
                    checked={selectedAccountIds.has(teammate.accountId)}
                    onCheckedChange={(checked) =>
                      toggleSelected(teammate.accountId, checked === true)
                    }
                    aria-invalid={errors.selectedAccountIds ? true : undefined}
                  />
                  <Label htmlFor={id}>{teammate.name}</Label>
                </div>
              );
            })
          )}
          {errors.selectedAccountIds && (
            <p
              id={selectedMessageId}
              className="text-input-helper text-status-error-fg"
            >
              {errors.selectedAccountIds}
            </p>
          )}
        </fieldset>
      )}
      <Button type="submit" variant="primary" className="mt-2 w-full">
        Send feedback
      </Button>
    </form>
  );
}
