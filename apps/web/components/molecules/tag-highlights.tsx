import { cva } from 'class-variance-authority';
import { Fragment } from 'react';
import { segmentsOf, type TextSegment, tagKeyOf } from '@/lib/tag-text.util';
import type { AutocompleteTrigger, TagTone } from './use-tag-autocomplete';

/** Colour only: a highlight that changed weight or spacing would no longer sit under its text. */
const highlight = cva('', {
  variants: {
    tone: { accent: 'text-fg-accent', secondary: 'text-action-secondary' },
  },
});

export type TagHighlightsProps = {
  text: string;
  triggers: readonly AutocompleteTrigger[];
};

/**
 * The field's text again, with every tag that names one of its options coloured. It is drawn
 * under a field whose own text is transparent, in the same box and type, so the colour sits
 * exactly under what is typed. A tag that names nothing stays the plain colour, which tells the
 * writer before sending that it will stay plain text.
 */
export function TagHighlights({ text, triggers }: TagHighlightsProps) {
  const known = new Map(
    triggers.map((trigger) => [
      trigger.rule.char,
      {
        tone: trigger.tone,
        keys: new Set(trigger.options.map((option) => tagKeyOf(option.value))),
      },
    ]),
  );
  function toneOf(segment: TextSegment): TagTone | null {
    if (segment.kind === 'text') {
      return null;
    }
    const named = known.get(segment.char);
    return named?.keys.has(segment.key) ? named.tone : null;
  }

  return (
    <>
      {segmentsOf(
        text,
        triggers.map((trigger) => trigger.rule),
      ).map((segment, index) => {
        const tone = toneOf(segment);
        return tone ? (
          // A segment's place is fixed by the text, and the whole list is redrawn when it changes.
          // biome-ignore lint/suspicious/noArrayIndexKey: see above
          <span key={index} className={highlight({ tone })}>
            {segment.text}
          </span>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: see above
          <Fragment key={index}>{segment.text}</Fragment>
        );
      })}
      {/* A zero-width space, so a final empty line still takes its height. */}
      {'\u200b'}
    </>
  );
}
