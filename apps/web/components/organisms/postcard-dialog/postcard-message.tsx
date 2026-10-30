import { useId, useState } from 'react';
import { Textarea } from '@/components/atoms/textarea';
import { cn } from '@/lib/cn.util';
import {
  cutToMessageLength,
  MAX_MESSAGE_LENGTH,
  messageLength,
} from '@/lib/feedback/message-length.util';
import styles from './postcard.module.css';
import {
  DEFAULT_SIZE_STEP,
  POSTCARD_ALIGNS,
  POSTCARD_FONTS,
  POSTCARD_INKS,
  POSTCARD_SIZES,
  type PostcardTextStyle,
} from './postcard-style.constant';

/**
 * The classes that set a message in its chosen font, size, alignment and ink. A size step the
 * scale does not have, as a caller's Ask might carry, falls back to the usual size.
 */
export function messageClassName(textStyle: PostcardTextStyle) {
  return cn(
    styles.sized,
    (POSTCARD_SIZES[textStyle.sizeStep] ?? POSTCARD_SIZES[DEFAULT_SIZE_STEP])
      ?.className,
    POSTCARD_FONTS[textStyle.font].className,
    POSTCARD_ALIGNS[textStyle.align],
    POSTCARD_INKS[textStyle.ink].textClassName,
  );
}

export type PostcardMessageProps = {
  message: string;
  textStyle: PostcardTextStyle;
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
 * and ink. It keeps its size and scrolls inside the card rather than growing with what is
 * typed, so a keystroke never lays the dialog out again. How much has been written shows under
 * it while it has the cursor, in a row kept for it, for the same reason.
 */
export function PostcardMessage({
  message,
  textStyle,
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <label htmlFor={messageId} className="sr-only">
        {label}
      </label>
      <Textarea
        ref={ref}
        id={messageId}
        value={message}
        aria-describedby={limitId}
        placeholder={placeholder}
        onChange={(event) =>
          onMessageChange(cutToMessageLength(event.target.value))
        }
        onFocus={handleFocus}
        onBlur={() => setHasCursor(false)}
        onPointerDown={onMessageFocus}
        className={cn(
          'field-sizing-fixed min-h-40 flex-1 resize-none rounded-none border-0 bg-transparent px-0 py-0 md:min-h-0',
          styles.message,
          isRuled && styles.ruled,
          messageClassName(textStyle),
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
