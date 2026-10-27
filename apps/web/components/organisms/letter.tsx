'use client';

import { cva } from 'class-variance-authority';
import { LockIcon, Rotate3dIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { Textarea } from '@/components/atoms/textarea';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import styles from './letter.module.css';
import { MemberMultiPicker } from './member-multi-picker';

/** The two faces of a letter: the Feedback message on the front, the Request message on the back. */
export type LetterSide = 'feedback' | 'request';

const SIDES = ['feedback', 'request'] as const;

const SIDE_COPY: Readonly<
  Record<
    LetterSide,
    {
      title: string;
      messageLabel: string;
      placeholder: string;
      /** Choosing who it is for: the button after "Dear" and the dialog it opens. */
      recipientsLabel: string;
      recipientsDescription: string;
    }
  >
> = {
  feedback: {
    title: 'Feedback message',
    messageLabel: 'Your feedback',
    placeholder: 'What did you notice, while it still matters?',
    recipientsLabel: "Choose who it's for",
    recipientsDescription: 'They can always read it.',
  },
  request: {
    title: 'Request message',
    messageLabel: 'What you would like feedback on',
    placeholder: 'What would you like their feedback on?',
    recipientsLabel: 'Choose who to ask',
    recipientsDescription: 'They each answer in their own words.',
  },
};

const stage = cva(styles.stage, {
  variants: {
    shaking: { true: styles.shake, false: '' },
  },
});

const face = cva(
  'relative col-start-1 row-start-1 flex min-h-120 flex-col overflow-hidden rounded-control border border-border-muted',
  {
    variants: {
      side: {
        feedback: cn(styles.face, styles.paper),
        request: cn(styles.face, styles.paper, styles.back),
      },
    },
  },
);

export type LetterProps = {
  /** The face being written, the only one that can be typed on; none, and both are only read. */
  writing: LetterSide | null;
  /** Who can be chosen after "Dear": the Members of the Workspace but the writer. */
  teammates: readonly Teammate[];
  /** Who the letter being written is for, after "Dear", by Account id. */
  recipientAccountIds: readonly string[];
  feedbackMessage: string;
  requestMessage: string;
  /** Whether the Request message points at the reader rather than the Feedback message. */
  isTurnedOver: boolean;
  /** Turn over shakes the letter instead of turning it, and says why. */
  isTurnLocked?: boolean;
  /** Turn over was pressed and the letter is free to turn. */
  onTurnOver: () => void;
  onRecipientsChange: (accountIds: readonly string[]) => void;
  onFeedbackMessageChange: (value: string) => void;
  onRequestMessageChange: (value: string) => void;
};

/**
 * Feedback as a letter: one sheet with the Feedback message on the front and the Request message
 * on the back, and Turn over beside it — to its right on a wide screen, above it on a narrow one.
 * Only the face being written can be typed on. The other shows its message as written, except
 * that while a Request is written the front is left for the people asked, and says so.
 *
 * "Dear" is followed by the people it is for, as a stack of faces ending in a dashed "+"; either
 * opens a dialog to choose them. When the face being written changes, focus goes to that button,
 * or to the message if somebody is already chosen.
 */
export function Letter({
  writing,
  teammates,
  recipientAccountIds,
  feedbackMessage,
  requestMessage,
  isTurnedOver,
  isTurnLocked = false,
  onTurnOver,
  onRecipientsChange,
  onFeedbackMessageChange,
  onRequestMessageChange,
}: LetterProps) {
  const [shaking, setShaking] = useState(false);
  const recipientRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const writingBefore = useRef(writing);
  const side: LetterSide = isTurnedOver ? 'request' : 'feedback';
  const otherSide: LetterSide = isTurnedOver ? 'feedback' : 'request';
  const messages = { feedback: feedbackMessage, request: requestMessage };
  const onMessageChange = {
    feedback: onFeedbackMessageChange,
    request: onRequestMessageChange,
  };

  // Only a change of face moves the cursor: arriving on the page leaves it where it was.
  useEffect(() => {
    if (writing === writingBefore.current) {
      return;
    }
    writingBefore.current = writing;
    if (writing === null) {
      return;
    }
    (recipientAccountIds.length === 0
      ? recipientRef
      : messageRef
    ).current?.focus();
  }, [writing, recipientAccountIds]);

  function handleTurnOver() {
    if (isTurnLocked) {
      setShaking(true);
      return;
    }
    onTurnOver();
  }

  function handleAnimationEnd(event: React.AnimationEvent) {
    if (event.target === event.currentTarget) {
      setShaking(false);
    }
  }

  function renderContent(letterSide: LetterSide) {
    if (writing === letterSide) {
      const copy = SIDE_COPY[letterSide];
      return (
        <LetterWriting
          teammates={teammates}
          recipientAccountIds={recipientAccountIds}
          recipientsLabel={copy.recipientsLabel}
          recipientsDescription={copy.recipientsDescription}
          message={messages[letterSide]}
          messageLabel={copy.messageLabel}
          placeholder={copy.placeholder}
          recipientRef={recipientRef}
          messageRef={messageRef}
          onRecipientsChange={onRecipientsChange}
          onMessageChange={onMessageChange[letterSide]}
        />
      );
    }
    if (writing === 'request' && letterSide === 'feedback') {
      return (
        <div
          className={cn(
            'flex flex-1 items-center justify-center px-4',
            styles.ruled,
          )}
        >
          <Text
            variant="subtitle-handwrite-2"
            tone="muted"
            className="max-w-xs text-center"
          >
            This side is for the people you request feedback from. They write
            their answer here.
          </Text>
        </div>
      );
    }
    return (
      <Text className={cn('flex-1 whitespace-pre-wrap', styles.ruled)}>
        {messages[letterSide]}
      </Text>
    );
  }

  return (
    <div className="relative flex w-full flex-col gap-3">
      <Button
        variant="secondary"
        size="icon"
        aria-disabled={isTurnLocked}
        onClick={handleTurnOver}
        className="self-end shadow-med lg:absolute lg:top-1/2 lg:left-full lg:ml-6 lg:-translate-y-1/2"
      >
        {isTurnLocked ? (
          <LockIcon aria-hidden className="size-4.5" />
        ) : (
          <Rotate3dIcon aria-hidden className="size-4.5" />
        )}
        <span className="sr-only">
          Turn over to {SIDE_COPY[otherSide].title}
        </span>
      </Button>
      <p aria-live="polite" className="sr-only">
        {isTurnLocked
          ? `The letter stays on ${SIDE_COPY[side].title} while you write it.`
          : ''}
      </p>

      <div className={stage({ shaking })} onAnimationEnd={handleAnimationEnd}>
        <div
          className={cn('grid', styles.sheet, isTurnedOver && styles.turned)}
        >
          {SIDES.map((letterSide) => (
            <section
              key={letterSide}
              aria-hidden={side !== letterSide}
              inert={side !== letterSide}
              className={face({ side: letterSide })}
            >
              <div className="flex flex-1 flex-col gap-6 px-6 pt-6 pb-8 md:px-10 md:pt-8 md:pb-10">
                <Text variant="subtitle-display-1" as="h2" className="pt-2">
                  {SIDE_COPY[letterSide].title}
                </Text>
                {renderContent(letterSide)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

type LetterWritingProps = {
  teammates: readonly Teammate[];
  recipientAccountIds: readonly string[];
  recipientsLabel: string;
  recipientsDescription: string;
  message: string;
  /** The message field's name for a screen reader; the paper shows no label for it. */
  messageLabel: string;
  placeholder: string;
  recipientRef: React.Ref<HTMLButtonElement>;
  messageRef: React.Ref<HTMLTextAreaElement>;
  onRecipientsChange: (accountIds: readonly string[]) => void;
  onMessageChange: (value: string) => void;
};

/** The face being written: who it is for, the message on the lines, and the writer's signature. */
function LetterWriting({
  teammates,
  recipientAccountIds,
  recipientsLabel,
  recipientsDescription,
  message,
  messageLabel,
  placeholder,
  recipientRef,
  messageRef,
  onRecipientsChange,
  onMessageChange,
}: LetterWritingProps) {
  const messageId = useId();

  return (
    <div className={cn('flex flex-1 flex-col gap-4', styles.reveal)}>
      <div className="flex items-center gap-4">
        {/* For the eye: the button after it names what it chooses for a screen reader. */}
        <span
          aria-hidden="true"
          className="font-handwrite text-subtitle-handwrite-1"
        >
          Dear
        </span>
        <MemberMultiPicker
          ref={recipientRef}
          teammates={teammates}
          value={recipientAccountIds}
          label={recipientsLabel}
          description={recipientsDescription}
          name="recipientAccountIds"
          onChange={onRecipientsChange}
        />
      </div>
      <label htmlFor={messageId} className="sr-only">
        {messageLabel}
      </label>
      <Textarea
        ref={messageRef}
        id={messageId}
        value={message}
        onChange={(event) => onMessageChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          'min-h-60 flex-1 resize-none rounded-none border-0 bg-transparent px-0 py-0',
          styles.ruled,
        )}
      />
      <p className="self-end font-handwrite text-subtitle-handwrite-1">— You</p>
    </div>
  );
}
