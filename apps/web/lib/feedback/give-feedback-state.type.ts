/**
 * What giving Feedback answers when it does not move on. Lives apart from the action, because
 * every export of a `'use server'` file is callable from the browser.
 */
export type GiveFeedbackState = {
  readonly fieldErrors?: {
    readonly receiverAccountIds?: string;
    readonly message?: string;
    readonly selectedAccountIds?: string;
  };
  readonly formError?: string;
};

/**
 * What giving Feedback calls: Home's server action, or anything shaped like it. The form takes
 * it as a prop, so the same form can run against something other than the API.
 */
export type GiveFeedbackAction = (
  previous: GiveFeedbackState,
  formData: FormData,
) => Promise<GiveFeedbackState>;
