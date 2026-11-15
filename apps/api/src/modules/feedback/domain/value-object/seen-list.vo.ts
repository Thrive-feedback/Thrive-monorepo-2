/**
 * The lists that count what is new in them since the Member last opened them: the answers to
 * their requests, Feedback given to them unasked and the Kudos that name them — the kinds of their
 * Received — and the Feedback somebody selected them to read, Shared with me on Home.
 */
export const SEEN_LISTS = [
  'RECEIVED_REQUESTS',
  'RECEIVED_OFFERED',
  'RECEIVED_KUDOS',
  'SHARED_WITH_ME',
] as const;

export type SeenListValue = (typeof SEEN_LISTS)[number];
