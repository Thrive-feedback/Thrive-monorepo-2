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
 * The message, stopped at the limit, as a field's `maxLength` would stop it: what comes after the
 * cursor stays and only what was just put in before it is cut, so nothing already written is lost.
 * `maxLength` itself counts code units, which would stop Thai long before the API does and could
 * split a cluster, so a field cuts with this instead. Spaces at either end cost nothing, as they
 * do at the API.
 */
export function cutToMessageLength(
  message: string,
  cursor = message.length,
): string {
  if (isWithinMessageLength(message)) {
    return message;
  }
  const before = message.slice(0, cursor);
  const after = message.slice(cursor);
  const indent = before.length - before.trimStart().length;
  const room = Math.max(
    0,
    MAX_MESSAGE_LENGTH - charactersOf(after.trimEnd()).length,
  );
  const kept = charactersOf(before.slice(indent)).slice(0, room).join('');
  return before.slice(0, indent) + kept + after;
}
