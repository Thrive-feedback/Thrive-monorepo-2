/**
 * What sending answers when it does not move on. Lives apart from the action, because every
 * export of a `'use server'` file is callable from the browser.
 */
export type RequestFeedbackState = {
  readonly fieldErrors?: {
    readonly giverAccountId?: string;
    readonly topic?: string;
  };
  readonly formError?: string;
};
