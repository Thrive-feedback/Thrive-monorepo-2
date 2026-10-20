import type { components } from '@repo/api';

/**
 * What some sent text was bound to when it was sent: the Workspace Goals its hashtags named, in
 * the Admin's spelling, and the Members its slugs named, by the name they went by. Only these
 * are highlighted; every other `#` or `@` in the text is plain.
 */
export type TextTags =
  components['schemas']['GetFeedbackResponseDto_Output']['tags'];

/** Text bound to nothing. */
export const NO_TEXT_TAGS: TextTags = { workspaceGoals: [], mentions: [] };
