import { useId } from 'react';
import { Textarea } from '@/components/atoms/textarea';
import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import {
  DEFAULT_SIZE_STEP,
  POSTCARD_ALIGNS,
  POSTCARD_FONTS,
  POSTCARD_INKS,
  POSTCARD_SIZES,
  type PostcardTextStyle,
} from './postcard-style.constant';

/** As long as the API lets a Feedback message be. */
const MAX_MESSAGE_LENGTH = 4000;

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
 * typed, so a keystroke never lays the dialog out again.
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

  return (
    <>
      <label htmlFor={messageId} className="sr-only">
        {label}
      </label>
      <Textarea
        ref={ref}
        id={messageId}
        value={message}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={placeholder}
        onChange={(event) => onMessageChange(event.target.value)}
        onFocus={onMessageFocus}
        onPointerDown={onMessageFocus}
        className={cn(
          'field-sizing-fixed min-h-40 flex-1 resize-none rounded-none border-0 bg-transparent px-0 py-0 md:min-h-0',
          isRuled && styles.ruled,
          messageClassName(textStyle),
        )}
      />
    </>
  );
}
