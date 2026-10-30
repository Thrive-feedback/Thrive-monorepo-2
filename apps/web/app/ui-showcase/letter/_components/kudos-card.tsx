import { cva } from 'class-variance-authority';
import { useId } from 'react';
import { AutocompleteTextarea } from '@/components/molecules/autocomplete-textarea';
import type { AutocompleteTrigger } from '@/components/molecules/use-tag-autocomplete';
import { cn } from '@/lib/cn.util';
import { MENTION_RULE } from '@/lib/feedback/text-tag-rules.constant';
import type { KudosStyle } from './kudos-styles.constant';
import styles from './letter.module.css';
import { LETTER_TEAMMATES } from './letter-teammates.mock';

/** `@` and a made-up teammate, written by their slug, as a Feedback message completes them. */
export const KUDOS_TRIGGERS: readonly AutocompleteTrigger[] = [
  {
    rule: MENTION_RULE,
    label: 'Teammates',
    tone: 'secondary',
    options: LETTER_TEAMMATES.flatMap(({ name, slug, displayName }) =>
      slug === null
        ? []
        : [
            {
              value: slug,
              label: displayName ?? name,
              keywords: [displayName ?? name, name, slug],
            },
          ],
    ),
  },
];

const card = cva(
  'flex aspect-9/16 w-72 shrink-0 flex-col items-center justify-center overflow-hidden rounded-control border border-border-muted p-6 shadow-high',
  {
    variants: {
      style: {
        confetti: styles.confetti,
        sunburst: styles.sunburst,
        stripes: styles.stripes,
      },
    },
  },
);

export type KudosCardProps = {
  style: KudosStyle;
  message: string;
  messageRef: React.Ref<HTMLTextAreaElement>;
  onMessageChange: (value: string) => void;
};

/**
 * A Kudos written on a small upright card. The message sits in the middle and grows from there,
 * up to the card's padding less room for the suggestions, then scrolls inside the card.
 */
export function KudosCard({
  style,
  message,
  messageRef,
  onMessageChange,
}: KudosCardProps) {
  const messageId = useId();

  return (
    <section aria-label="Kudos" className={cn(card({ style }), styles.reveal)}>
      <label htmlFor={messageId} className="sr-only">
        Your Kudos
      </label>
      <AutocompleteTextarea
        ref={messageRef}
        id={messageId}
        value={message}
        triggers={KUDOS_TRIGGERS}
        onChange={(event) => onMessageChange(event.target.value)}
        placeholder="@a teammate, and what they did well"
        className="max-h-96 min-h-0 resize-none rounded-none border-0 bg-transparent px-0 py-0 text-center text-subtitle-2 placeholder:text-fg-secondary"
      />
    </section>
  );
}
