/** As long as the API lets a Feedback message or a Request message be. */
export const MAX_MESSAGE_LENGTH = 1000;

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function charactersOf(text: string): string[] {
  return Array.from(graphemes.segment(text), ({ segment }) => segment);
}

/** How long a message is, as the API counts it: trimmed, an emoji or a Thai cluster as one. */
export function messageLength(message: string): number {
  return charactersOf(message.trim()).length;
}

export function isWithinMessageLength(message: string): boolean {
  return messageLength(message) <= MAX_MESSAGE_LENGTH;
}

/**
 * The message, stopped at the limit. A field's `maxLength` counts code units, which would stop
 * Thai long before the API does and could split a cluster, so a field cuts with this instead.
 */
export function cutToMessageLength(message: string): string {
  return isWithinMessageLength(message)
    ? message
    : charactersOf(message).slice(0, MAX_MESSAGE_LENGTH).join('');
}
