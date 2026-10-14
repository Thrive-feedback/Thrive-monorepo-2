'use client';

import { startTransition, useActionState, useRef, useState } from 'react';
import { answerAsk } from '@/app/(signed-in)/(member)/home/_lib/answer-ask-actions.service';
import type { AnswerAskState } from '@/app/(signed-in)/(member)/home/_lib/answer-ask-state.type';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { TextAreaField } from '@/components/molecules/text-area-field';

export type AnswerAskFormProps = {
  askId: string;
  /** Named in the label, so the box says who will read this. */
  requesterName: string | null;
};

const MAX_ANSWER_LENGTH = 4000;
/** Far enough in that the count is news, close enough that it still helps. */
const COUNT_FROM = 3500;
const WRITE_SOMETHING = 'Write your answer before sending it.';

/**
 * Send stays enabled on an empty box on purpose: pressing it is how a person finds out what is
 * missing, and a disabled button explains nothing. The box stays controlled, so what was
 * written survives a refusal — nobody should lose four paragraphs to a failed send.
 *
 * Submitted by hand rather than through `action`, because React resets a form after its
 * action, which would clear the box while the state behind it still held the text.
 */
export function AnswerAskForm({ askId, requesterName }: AnswerAskFormProps) {
  const [body, setBody] = useState('');
  const [clientError, setClientError] = useState<string | undefined>();
  const [state, formAction, isSending] = useActionState<
    AnswerAskState,
    FormData
  >(answerAsk, {});
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const errorMessage = clientError ?? state.fieldErrors?.body;
  const remaining = MAX_ANSWER_LENGTH - body.length;

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setBody(event.target.value);
    setClientError(undefined);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (body.trim() === '') {
      setClientError(WRITE_SOMETHING);
      bodyRef.current?.focus();
      return;
    }
    setClientError(undefined);
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="askId" value={askId} />
      <TextAreaField
        ref={bodyRef}
        label={`What would you tell ${requesterName ?? 'them'}?`}
        name="body"
        rows={8}
        required
        value={body}
        onChange={handleChange}
        errorMessage={errorMessage}
        helperText={
          body.length > COUNT_FROM
            ? `${remaining.toLocaleString('en-GB')} characters left.`
            : 'They see your name with your answer. Say what you would say in person.'
        }
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
        {isSending ? 'Sending…' : 'Send answer'}
      </Button>
    </form>
  );
}
