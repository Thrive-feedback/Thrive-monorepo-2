import { useId, useRef } from 'react';
import { AutocompleteTextarea } from '@/components/molecules/autocomplete-textarea';
import type { AutocompleteTrigger } from '@/components/molecules/use-tag-autocomplete';
import { metricsClassName } from '@/components/organisms/postcard-dialog/postcard-message-style.util';
import { POSTCARD_INKS } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { cn } from '@/lib/cn.util';
import { MAX_KUDOS_LENGTH } from '@/lib/feedback/kudos-item.type';
import { cutFieldToMessageLength } from '@/lib/feedback/message-length.util';
import styles from './kudos-card.module.css';
import {
  KUDOS_PLACEHOLDER_INKS,
  KUDOS_TEMPLATES,
  type KudosTemplateKey,
  type KudosTextStyle,
} from './kudos-template.constant';
import { useFittedSize } from './use-fitted-size';

const PLACEHOLDER =
  'Say well done in a few words. Name someone with @, or leave it for the whole Workspace.';

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
 * The words being written on a Kudos card, in the middle of it and growing from there. They are set
 * as large as fits the card, up to the size chosen, so they fill it and it never scrolls (ADR 0092). The whole card inside its border takes the words: pressing anywhere on it
 * puts the cursor at their end.
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
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const { roomRef, style } = useFittedSize({
    textStyle,
    text: message || PLACEHOLDER,
  });

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onMessageChange(
      cutFieldToMessageLength(event.currentTarget, MAX_KUDOS_LENGTH),
    );
  }

  /** A press on the card round the words writes on, from their end. */
  function handleRoomMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    const field = fieldRef.current;
    // The field takes its own presses, and a suggestion is a button of its own.
    if (
      !field ||
      !(event.target instanceof Element) ||
      event.target.closest('textarea, button')
    ) {
      return;
    }
    event.preventDefault();
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    onMessageFocus();
  }

  return (
    <div className={cn('absolute inset-0', styles.writing)}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: a larger target for the field inside it, which keeps its own label, focus and keys. */}
      <div
        ref={roomRef}
        style={style}
        // Space on a card has no name a person would use to find it.
        data-testid="kudos-writing-room"
        onMouseDown={handleRoomMouseDown}
        className="relative flex size-full cursor-text items-center justify-center"
      >
        <label htmlFor={messageId} className="sr-only">
          Your Kudos
        </label>
        <span id={limitId} className="sr-only">
          Up to {MAX_KUDOS_LENGTH} characters.
        </span>
        <AutocompleteTextarea
          ref={(node) => {
            fieldRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          id={messageId}
          value={message}
          triggers={triggers}
          aria-describedby={limitId}
          placeholder={PLACEHOLDER}
          onChange={handleChange}
          onFocus={onMessageFocus}
          onPointerDown={onMessageFocus}
          className={cn(
            // The card is the field: the cursor and the text tools show it is being written in.
            'min-h-0 resize-none rounded-none border-0 bg-transparent px-0 py-0 placeholder:opacity-70 focus-visible:outline-hidden',
            styles.noScrollbar,
            metricsClassName(textStyle),
            styles.fitted,
            KUDOS_TEMPLATES[templateKey].caretClassName,
            KUDOS_PLACEHOLDER_INKS[textStyle.ink],
          )}
          textClassName={cn(
            POSTCARD_INKS[textStyle.ink].textClassName,
            styles.tags,
          )}
        />
      </div>
    </div>
  );
}
