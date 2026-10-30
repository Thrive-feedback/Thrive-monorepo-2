import { MAX_MESSAGE_LENGTH } from './message-length.util';

const MAX_MESSAGE_LENGTH_IN_WORDS = MAX_MESSAGE_LENGTH.toLocaleString('en-GB');

export const FEEDBACK_TOO_LONG = `Your feedback is too long. Keep it under ${MAX_MESSAGE_LENGTH_IN_WORDS} characters.`;

export const REQUEST_TOO_LONG = `That request is too long. Keep it under ${MAX_MESSAGE_LENGTH_IN_WORDS} characters.`;

/** What to say when the API refused Feedback given without being asked, by its error code. */
export const GIVE_FEEDBACK_ERRORS: Readonly<Record<string, string>> = {
  RECEIVER_NOT_IN_WORKSPACE:
    'Someone you picked it for is no longer in your Workspace.',
  CANNOT_GIVE_YOURSELF_FEEDBACK: "You can't give yourself Feedback.",
  NO_PEOPLE_SELECTED: 'Pick at least one person to share it with.',
  SELECTED_PERSON_NOT_IN_WORKSPACE:
    'Someone you picked to share it with is no longer in your Workspace.',
  MENTIONED_PERSON_LEFT_OUT:
    'Everyone you mention must be able to read it. Share it with them, or with everyone.',
  FEEDBACK_MESSAGE_TOO_LONG: FEEDBACK_TOO_LONG,
};

/** What to say when the API refused a Feedback Request, by its error code. */
export const REQUEST_FEEDBACK_ERRORS: Readonly<Record<string, string>> = {
  GIVER_NOT_IN_WORKSPACE:
    'Someone you picked to ask is no longer in your Workspace.',
  CANNOT_ASK_YOURSELF: "You can't ask yourself for Feedback.",
  GIVER_ALREADY_ASKED: 'You picked the same teammate twice.',
  REQUEST_MESSAGE_TOO_LONG: REQUEST_TOO_LONG,
  NO_PEOPLE_SELECTED: 'Pick at least one person to share it with.',
  SELECTED_PERSON_NOT_IN_WORKSPACE:
    'Someone you picked to share it with is no longer in your Workspace.',
  MENTIONED_PERSON_LEFT_OUT:
    'Everyone you mention must be able to read it. Share it with them, or with everyone.',
};
