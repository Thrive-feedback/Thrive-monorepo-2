import type { TagRule } from '@/lib/tag-text.util';

/**
 * A Workspace Goal's hashtag: `#` then letters of any script with their marks — Thai vowels and
 * tone marks are marks — digits, `_` and `-`, everything a Workspace Goal's name may hold.
 */
export const HASHTAG_RULE: TagRule = {
  char: '#',
  body: /[\p{L}\p{M}\p{N}_-]+/u,
  typing: /[\p{L}\p{M}\p{N}_-]/u,
};

/**
 * A Mention: `@` then a Profile's slug, which never starts or ends with a separator or holds
 * two together, so the full stop in `thanks @ann.lee.` ends the sentence. While picking, a
 * Member is searched by their name too, in any script.
 */
export const MENTION_RULE: TagRule = {
  char: '@',
  body: /[a-z0-9]+(?:[._-][a-z0-9]+)*/iu,
  typing: /[\p{L}\p{M}\p{N}._-]/u,
};

/** The tags a Request message and a Feedback message are written with, recognised as the API binds them. */
export const TEXT_TAG_RULES: readonly TagRule[] = [HASHTAG_RULE, MENTION_RULE];
