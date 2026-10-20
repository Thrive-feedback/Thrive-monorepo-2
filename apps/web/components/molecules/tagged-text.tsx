import { cva } from 'class-variance-authority';
import { Fragment } from 'react';
import { segmentsOf, type TagRule, tagKeyOf } from '@/lib/tag-text.util';
import type { TagTone } from './use-tag-autocomplete';

const pill = cva('rounded-chip box-decoration-clone px-1', {
  variants: {
    tone: {
      accent: 'bg-action-primary-surface text-fg-accent',
      secondary: 'bg-action-secondary-surface text-action-secondary',
    },
  },
});

/** A tag some text was bound to, and how it reads there. */
export type TextTag = {
  /** The character it is written with. */
  readonly char: string;
  /** What follows the character, as it was bound — matched ignoring letter case. */
  readonly value: string;
  /** What is shown in its place, such as the name it was written for. */
  readonly label: string;
  readonly tone: TagTone;
};

export type TaggedTextProps = {
  text: string;
  /** How tags are written in it. */
  rules: readonly TagRule[];
  /** The tags it was bound to. A tag written in it but not here stays plain text. */
  tags: readonly TextTag[];
};

/**
 * Text as it was written, with each tag it was bound to drawn as a pill reading that tag's label.
 * It renders inline runs only, so it takes the paragraph, wrapping and type of whatever holds it.
 */
export function TaggedText({ text, rules, tags }: TaggedTextProps) {
  const bound = new Map(
    tags.map((tag) => [`${tag.char}${tagKeyOf(tag.value)}`, tag]),
  );
  return (
    <>
      {segmentsOf(text, rules).map((segment, index) => {
        const tag =
          segment.kind === 'tag'
            ? bound.get(`${segment.char}${segment.key}`)
            : undefined;
        return tag ? (
          // A segment's place is fixed by the text, and the whole list is redrawn when it changes.
          // biome-ignore lint/suspicious/noArrayIndexKey: see above
          <span key={index} className={pill({ tone: tag.tone })}>
            {tag.label}
          </span>
        ) : (
          // Plain runs add no element, so the text reads as one with whatever holds it.
          // biome-ignore lint/suspicious/noArrayIndexKey: see above
          <Fragment key={index}>{segment.text}</Fragment>
        );
      })}
    </>
  );
}
