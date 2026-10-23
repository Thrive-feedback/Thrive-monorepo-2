'use client';

import { cva } from 'class-variance-authority';
import { LockIcon, Rotate3dIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Text } from '@/components/atoms/text';
import { Textarea } from '@/components/atoms/textarea';
import { cn } from '@/lib/cn.util';
import styles from './letter.module.css';

/** The two faces of a letter: the Feedback message on the front, the Request message on the back. */
export type LetterSide = 'feedback' | 'request';

const SIDES = ['feedback', 'request'] as const;

const SIDE_COPY: Readonly<
  Record<
    LetterSide,
    { title: string; messageLabel: string; placeholder: string }
  >
> = {
  feedback: {
    title: 'Feedback message',
    messageLabel: 'Your feedback',
    placeholder: 'What did you notice, while it still matters?',
  },
  request: {
    title: 'Request message',
    messageLabel: 'What you would like feedback on',
    placeholder: 'What would you like their feedback on?',
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
  /** Who the letter being written is for, after "Dear". */
  recipient: string;
  feedbackMessage: string;
  requestMessage: string;
  /** Whether the Request message points at the reader rather than the Feedback message. */
  isTurnedOver: boolean;
  /** Turn over shakes the letter instead of turning it, and says why. */
  isTurnLocked?: boolean;
  /** Turn over was pressed and the letter is free to turn. */
  onTurnOver: () => void;
  onRecipientChange: (value: string) => void;
  onFeedbackMessageChange: (value: string) => void;
  onRequestMessageChange: (value: string) => void;
};

/**
 * Feedback as a letter: one sheet with the Feedback message on the front and the Request message
 * on the back, and Turn over beside it — to its right on a wide screen, above it on a narrow one.
 * Only the face being written can be typed on. The other shows its message as written, except
 * that while a Request is written the front is left for the people asked, and says so.
 *
 * When the face being written changes, the cursor goes to "Dear", or to the message if who it is
 * for is already filled in.
 */
export function Letter({
  writing,
  recipient,
  feedbackMessage,
  requestMessage,
  isTurnedOver,
  isTurnLocked = false,
  onTurnOver,
  onRecipientChange,
  onFeedbackMessageChange,
  onRequestMessageChange,
}: LetterProps) {
  const [shaking, setShaking] = useState(false);
  const recipientRef = useRef<HTMLInputElement>(null);
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
    (recipient === '' ? recipientRef : messageRef).current?.focus();
  }, [writing, recipient]);

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
          recipient={recipient}
          message={messages[letterSide]}
          messageLabel={copy.messageLabel}
          placeholder={copy.placeholder}
          recipientRef={recipientRef}
          messageRef={messageRef}
          onRecipientChange={onRecipientChange}
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
  recipient: string;
  message: string;
  /** The message field's name for a screen reader; the paper shows no label for it. */
  messageLabel: string;
  placeholder: string;
  recipientRef: React.Ref<HTMLInputElement>;
  messageRef: React.Ref<HTMLTextAreaElement>;
  onRecipientChange: (value: string) => void;
  onMessageChange: (value: string) => void;
};

/** The face being written: who it is for, the message on the lines, and the writer's signature. */
function LetterWriting({
  recipient,
  message,
  messageLabel,
  placeholder,
  recipientRef,
  messageRef,
  onRecipientChange,
  onMessageChange,
}: LetterWritingProps) {
  const recipientId = useId();
  const messageId = useId();

  return (
    <div className={cn('flex flex-1 flex-col gap-4', styles.reveal)}>
      <div className="flex items-baseline gap-3">
        <label
          htmlFor={recipientId}
          className="font-handwrite text-subtitle-handwrite-1"
        >
          Dear
        </label>
        <Input
          ref={recipientRef}
          id={recipientId}
          value={recipient}
          onChange={(event) => onRecipientChange(event.target.value)}
          placeholder="a teammate"
          autoComplete="off"
          className="flex-1 rounded-none border-x-0 border-t-0 bg-transparent px-0"
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
