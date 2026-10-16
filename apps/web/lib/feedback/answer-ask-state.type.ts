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

/**
 * What answering an Ask calls: Home's server action, or anything shaped like it. The form takes
 * it as a prop, so the same form can run against something other than the API.
 */
export type AnswerAskAction = (
  previous: AnswerAskState,
  formData: FormData,
) => Promise<AnswerAskState>;
