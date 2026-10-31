import { useId } from 'react';
import { AutocompleteTextarea } from '@/components/molecules/autocomplete-textarea';
import type { AutocompleteTrigger } from '@/components/molecules/use-tag-autocomplete';
import { metricsClassName } from '@/components/organisms/postcard-dialog/postcard-message-style.util';
import { POSTCARD_INKS } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { cn } from '@/lib/cn.util';
import { MAX_KUDOS_LENGTH } from '@/lib/feedback/kudos-item.type';
import {
  cutFieldToMessageLength,
  messageLength,
} from '@/lib/feedback/message-length.util';
import styles from './kudos-card.module.css';
import { fittedSizeStep } from './kudos-card.util';
import {
  KUDOS_TEMPLATES,
  type KudosTemplateKey,
  type KudosTextStyle,
} from './kudos-template.constant';

export type KudosMessageProps = {
  message: string;
  templateKey: KudosTemplateKey;
  textStyle: KudosTextStyle;
  /** What it completes as it is typed: `@` for teammates, `#` for Workspace Goals. */
  triggers: readonly AutocompleteTrigger[];
  ref?: React.Ref<HTMLTextAreaElement>;
  onMessageChange: (message: string) => void;
  /** The cursor went into the message, or it was clicked, so the text tools can take the bar. */
  onMessageFocus: () => void;
};

/**
 * The words being written on a Kudos card, in the middle of it and growing from there. It never
 * scrolls: the longer it gets, the smaller it is set, down from the size chosen.
 */
export function KudosMessage({
  message,
  templateKey,
  textStyle,
  triggers,
  ref,
  onMessageChange,
  onMessageFocus,
}: KudosMessageProps) {
  const messageId = useId();
  const limitId = useId();
  const fitted = {
    ...textStyle,
    sizeStep: fittedSizeStep(textStyle.sizeStep, messageLength(message)),
  };

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onMessageChange(
      cutFieldToMessageLength(event.currentTarget, MAX_KUDOS_LENGTH),
    );
  }

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        styles.writing,
      )}
    >
      <label htmlFor={messageId} className="sr-only">
        Your Kudos
      </label>
      <span id={limitId} className="sr-only">
        Up to {MAX_KUDOS_LENGTH} characters.
      </span>
      <AutocompleteTextarea
        ref={ref}
        id={messageId}
        value={message}
        triggers={triggers}
        aria-describedby={limitId}
        placeholder="Say well done in a few words. Name someone with @, or leave it for the whole Workspace."
        onChange={handleChange}
        onFocus={onMessageFocus}
        onPointerDown={onMessageFocus}
        className={cn(
          // The card is the field: the cursor and the text tools show it is being written in.
          'min-h-0 resize-none rounded-none border-0 bg-transparent px-0 py-0 focus-visible:outline-hidden',
          metricsClassName(fitted),
          KUDOS_TEMPLATES[templateKey].fieldClassName,
        )}
        textClassName={cn(
          POSTCARD_INKS[textStyle.ink].textClassName,
          styles.tags,
        )}
      />
    </div>
  );
}
