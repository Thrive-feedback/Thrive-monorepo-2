/**
 * How a person writes Feedback: on a postcard, with its picture, stamp and stickers, or plain, as
 * words on a sheet. Only the look of writing differs; what is sent is the same, and everybody reads
 * it as a postcard.
 */
export const FEEDBACK_STYLES = ['postcard', 'plain'] as const;

export type FeedbackStyle = (typeof FEEDBACK_STYLES)[number];

/** What anyone who has not chosen sees. */
export const DEFAULT_FEEDBACK_STYLE: FeedbackStyle = 'postcard';

/**
 * Where the choice is kept: a cookie, so the server hands it to the page as it draws it, and the
 * switch shows the right state from the first paint rather than flipping once the browser reads it.
 */
export const FEEDBACK_STYLE_COOKIE = 'thrive.feedback-style';

/** A year, in seconds: a choice of look outlasts any one visit. */
export const FEEDBACK_STYLE_MAX_AGE = 60 * 60 * 24 * 365;

/** What each style is called wherever it is offered. */
export const FEEDBACK_STYLE_LABELS: Readonly<Record<FeedbackStyle, string>> = {
  postcard: 'Postcard',
  plain: 'Plain',
};

/** Whatever the cookie holds, as a style: anything it does not name is the default. */
export function parseFeedbackStyle(value: unknown): FeedbackStyle {
  return (
    FEEDBACK_STYLES.find((style) => style === value) ?? DEFAULT_FEEDBACK_STYLE
  );
}
