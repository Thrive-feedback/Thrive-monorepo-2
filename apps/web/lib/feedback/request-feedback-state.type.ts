/**
 * What sending answers when it does not move on. Lives apart from the action, because every
 * export of a `'use server'` file is callable from the browser.
 */
export type RequestFeedbackState = {
  readonly fieldErrors?: {
    readonly giverAccountId?: string;
    readonly topic?: string;
    readonly selectedAccountIds?: string;
  };
  readonly formError?: string;
};

/**
 * What sending a Feedback Request calls: Home's server action, or anything shaped like it. The
 * form takes it as a prop, so the same form can run against something other than the API.
 */
export type RequestFeedbackAction = (
  previous: RequestFeedbackState,
  formData: FormData,
) => Promise<RequestFeedbackState>;
