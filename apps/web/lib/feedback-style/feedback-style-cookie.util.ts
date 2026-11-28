import {
  FEEDBACK_STYLE_COOKIE,
  FEEDBACK_STYLE_MAX_AGE,
  type FeedbackStyle,
} from './feedback-style.constant';

/** The part of the browser's Cookie Store API this needs; TypeScript's DOM types do not have it yet. */
type CookieStoreLike = {
  set(cookie: {
    name: string;
    value: string;
    path: string;
    expires: number;
    sameSite: 'lax';
  }): Promise<void>;
};

declare global {
  /** The browser's Cookie Store, missing from older browsers and from jsdom. */
  var cookieStore: CookieStoreLike | undefined;
}

/**
 * Keeps the style the person chose in a cookie, from the browser. Written here rather than by the
 * server because a server action that sets a cookie draws the page again, and nothing on the page
 * is drawn differently for it; the server only reads it as the next page loads. A browser without
 * the Cookie Store API keeps the choice until the page is left.
 */
export async function keepFeedbackStyle(style: FeedbackStyle): Promise<void> {
  await globalThis.cookieStore?.set({
    name: FEEDBACK_STYLE_COOKIE,
    value: style,
    path: '/',
    expires: Date.now() + FEEDBACK_STYLE_MAX_AGE * 1000,
    sameSite: 'lax',
  });
}
