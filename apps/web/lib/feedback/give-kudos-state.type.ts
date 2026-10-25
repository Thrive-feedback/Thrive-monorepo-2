/**
 * What giving Kudos answers when it does not move on. Lives apart from the action, because every
 * export of a `'use server'` file is callable from the browser.
 */
export type GiveKudosState = {
  readonly fieldErrors?: {
    readonly message?: string;
  };
  readonly formError?: string;
};

/**
 * What giving Kudos calls: Home's server action, or anything shaped like it. The form takes it as
 * a prop, so the same form can run against something other than the API.
 */
export type GiveKudosAction = (
  previous: GiveKudosState,
  formData: FormData,
) => Promise<GiveKudosState>;
