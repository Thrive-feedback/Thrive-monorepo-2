/**
 * What answering says when it does not move on. Lives apart from the action, because every
 * export of a `'use server'` file is callable from the browser.
 */
export type AnswerAskState = {
  readonly fieldErrors?: {
    readonly body?: string;
  };
  readonly formError?: string;
};
