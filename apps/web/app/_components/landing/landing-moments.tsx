import { Badge, type BadgeTone } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { cn } from '@/lib/cn.util';
import styles from './landing.module.css';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingMomentCard } from './landing-moment-card';
import { LandingSection } from './landing-section';

const { moments } = LANDING_COPY;

/** Asking is blue and giving is plum, as on the desk above. */
const KIND_TONES = {
  asked: 'info',
  gave: 'brand',
} as const satisfies Record<keyof typeof moments.kinds, BadgeTone>;

/**
 * Two moments, each beside the postcard it would be written on: an ask with what came back on the
 * same postcard, and one piece of feedback given unasked. Each card is drawn small and opens to be
 * read at full size; its words are quoted once more, unseen, for assistive technology, which skips
 * the card. Feedback given unasked has no reply in the app, so its answer sits under its card. The
 * cards alternate sides down the page, a degree off square, as post lies on a table.
 */
export function LandingMoments() {
  return (
    <LandingSection id={moments.id} title={moments.title} note={moments.note}>
      {/* A light rule between Moments, midway in the space between them. */}
      <ol className="flex flex-col gap-8 md:gap-12">
        {moments.items.map((moment, index) => {
          const isFlipped = index % 2 === 1;
          return (
            <li
              key={moment.when}
              className="grid items-center gap-6 border-border-muted border-t pt-8 first:border-t-0 first:pt-0 md:gap-8 md:pt-12 lg:grid-cols-5 lg:gap-gap-grid"
            >
              <div
                className={cn(
                  'flex flex-col gap-3 lg:col-span-2',
                  isFlipped && 'lg:order-2',
                )}
              >
                <div className="flex flex-col gap-1">
                  <Text
                    as="h3"
                    variant="subtitle-display-1"
                    className="text-balance"
                  >
                    {moment.when}
                  </Text>
                  <Text variant="body-1" tone="muted">
                    {moment.who}
                  </Text>
                </div>
                <div className="sr-only">
                  <Text variant="body-1">
                    <q>{moment.said}</q>
                  </Text>
                  {moment.reply && moment.kind === 'asked' && (
                    <Text variant="body-1" tone="muted">
                      <span className="block text-caption">
                        {moments.replyLabel}
                      </span>
                      <q>{moment.reply}</q>
                    </Text>
                  )}
                </div>
                <HandwrittenNote tilt="left" className="mt-2">
                  {moment.hint}
                </HandwrittenNote>
              </div>
              <div
                className={cn(
                  // As wide as its card, against the start of its column: next to the words on an
                  // Ask, and on the grid's left edge where the card comes first, as Feedback given
                  // unasked does, so its title stands well clear of the card and its reply.
                  'flex w-full max-w-112 flex-col gap-4 justify-self-center lg:col-span-3',
                  isFlipped && 'lg:order-1',
                  'lg:justify-self-start',
                )}
              >
                <div
                  className={cn(
                    'relative w-full',
                    isFlipped ? styles.leanLeft : styles.leanRight,
                  )}
                >
                  <LandingMomentCard
                    index={index}
                    label={`${moments.read} ${moment.when}`}
                  />
                  <Badge
                    tone={KIND_TONES[moment.kind]}
                    size="md"
                    edged
                    solid
                    className={cn('absolute -top-3 left-4 shadow-low')}
                  >
                    {moments.kinds[moment.kind]}
                  </Badge>
                </div>
                {moment.reply && moment.kind === 'gave' && (
                  <div className="flex max-w-11/12 flex-col gap-1 self-end rounded-page rounded-tr-element border border-border-muted bg-surface-base p-4 md:max-w-4/5">
                    <Text as="p" variant="caption" tone="muted">
                      {moments.replyLabel}
                    </Text>
                    <Text variant="body-1">
                      <q>{moment.reply}</q>
                    </Text>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <Text
        variant="subtitle-display-1"
        className="mx-auto max-w-2xl text-balance text-center"
      >
        {moments.closer}
      </Text>
    </LandingSection>
  );
}
