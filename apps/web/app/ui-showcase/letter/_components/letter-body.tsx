import { useId } from 'react';
import { Input } from '@/components/atoms/input';
import { Textarea } from '@/components/atoms/textarea';
import { cn } from '@/lib/cn.util';
import styles from './letter.module.css';

export type LetterBodyProps = {
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

/**
 * What is written on a face of the letter: who it is for, the message on the lines, and the
 * writer's signature.
 */
export function LetterBody({
  recipient,
  message,
  messageLabel,
  placeholder,
  recipientRef,
  messageRef,
  onRecipientChange,
  onMessageChange,
}: LetterBodyProps) {
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
