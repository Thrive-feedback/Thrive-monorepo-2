import type { components } from '@repo/api';

type OfferedFeedback = components['schemas']['OfferFeedbackRequestDto'];

/** How a card looks, as the API stores it. */
export type PostcardLook = NonNullable<OfferedFeedback['postcard']>;

/**
 * Everything on a card as the server action takes it: plain data, since a call from the browser
 * carries nothing else. Lives apart from the action, because every export of a `'use server'`
 * file is callable from the browser.
 */
export type SentPostcard = {
  /** Who it is for, or who is asked. */
  readonly recipientAccountIds: readonly string[];
  readonly message: string;
  readonly visibility: OfferedFeedback['visibility'];
  readonly selectedAccountIds: readonly string[];
  readonly look: PostcardLook;
};

/** What an answer decides about how it looks, as the API stores it. */
export type AnswerLook = NonNullable<
  components['schemas']['AnswerFeedbackAskRequestDto']['postcard']
>;

/** Everything on an answer as the server action takes it. */
export type SentAnswer = {
  readonly message: string;
  readonly look: AnswerLook;
};

/** What sending answers: a sentence to show when it did not go, and nothing when it did. */
export type SendPostcardResult = {
  readonly formError?: string;
};
