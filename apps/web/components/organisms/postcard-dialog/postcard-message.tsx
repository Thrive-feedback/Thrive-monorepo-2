import { useId, useState } from 'react';
import { AutocompleteTextarea } from '@/components/molecules/autocomplete-textarea';
import type { AutocompleteTrigger } from '@/components/molecules/use-tag-autocomplete';
import { cn } from '@/lib/cn.util';
import {
  cutToMessageLength,
  MAX_MESSAGE_LENGTH,
  messageLength,
} from '@/lib/feedback/message-length.util';
import styles from './postcard.module.css';
import { metricsClassName } from './postcard-message-style.util';
import {
  POSTCARD_INKS,
  type PostcardTextStyle,
} from './postcard-style.constant';

export type PostcardMessageProps = {
  message: string;
  textStyle: PostcardTextStyle;
  /** The tags it completes as they are typed: `@` for teammates, `#` for Workspace Goals. */
  triggers: readonly AutocompleteTrigger[];
  /** The field's name for a screen reader; the card shows no label for it. */
  label: string;
  placeholder: string;
  /** Writing lines under the text, as on a letter; printed stationery has none. */
  isRuled?: boolean;
  ref?: React.Ref<HTMLTextAreaElement>;
  onMessageChange: (message: string) => void;
  /** The cursor went into the message, or it was clicked, so the text tools can take the bar. */
  onMessageFocus: () => void;
};

/**
 * The message being written on the postcard, set in the writer's chosen font, size, alignment
 * and ink, completing `@` and `#` as they are typed, as the composer on Home does. It keeps its
 * size and scrolls inside the card rather than growing with what is typed, so a keystroke never
 * lays the dialog out again. How much has been written shows under it while it has the cursor,
 * in a row kept for it, for the same reason.
 */
export function PostcardMessage({
  message,
  textStyle,
  triggers,
  label,
  placeholder,
  isRuled = true,
  ref,
  onMessageChange,
  onMessageFocus,
}: PostcardMessageProps) {
  const messageId = useId();
  const limitId = useId();
  const [hasCursor, setHasCursor] = useState(false);

  function handleFocus() {
    setHasCursor(true);
    onMessageFocus();
  }

  // What is cut goes from the field itself as well as from the state: left to React, the shorter
  // value would be written back over it and the cursor thrown to the end of the message.
  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const field = event.currentTarget;
    const cursor = field.selectionStart;
    const kept = cutToMessageLength(field.value, cursor);
    if (kept !== field.value) {
      const cursorAfterCut = cursor - (field.value.length - kept.length);
      field.value = kept;
      field.setSelectionRange(cursorAfterCut, cursorAfterCut);
    }
    onMessageChange(kept);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <label htmlFor={messageId} className="sr-only">
        {label}
      </label>
      <AutocompleteTextarea
        ref={ref}
        fill
        id={messageId}
        value={message}
        triggers={triggers}
        aria-describedby={limitId}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={() => setHasCursor(false)}
        onPointerDown={onMessageFocus}
        className={cn(
          // The paper is the field: the cursor and the text tools show it is being written in.
          'field-sizing-fixed min-h-40 resize-none rounded-none border-0 bg-transparent px-0 py-0 focus-visible:outline-hidden md:min-h-0',
          styles.message,
          metricsClassName(textStyle),
        )}
        textClassName={cn(
          POSTCARD_INKS[textStyle.ink].textClassName,
          isRuled && styles.ruled,
        )}
      />
      <span id={limitId} className="sr-only">
        Up to {MAX_MESSAGE_LENGTH.toLocaleString('en-GB')} characters.
      </span>
      {/* Read out by nobody: it changes on every keystroke, and the limit is said above. Hidden
          rather than taken out: the moment focus leaves the message it is on nothing, and the
          dialog's focus trap takes a node removed then for the focused one going, and pulls focus
          to the dialog, which closes the text tools under the press that was reaching them. */}
      <div
        aria-hidden="true"
        className="h-5 shrink-0 text-right text-body-3 text-fg-secondary tabular-nums"
      >
        <span hidden={!hasCursor}>
          {messageLength(message)}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>
    </div>
  );
}
