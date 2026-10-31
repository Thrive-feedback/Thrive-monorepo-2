import { Badge, type BadgeTone } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';

const { moments } = LANDING_COPY;

/**
 * Each kind of moment wears its own badge colour, so asking, giving and thanking read apart at a
 * glance. The bubble is already a tint, and a tinted badge would vanish into it, so every badge
 * sits on the page's surface and its tone colours only the word.
 */
const KIND_TONES = {
  asked: 'brand',
  gave: 'success',
  kudos: 'highlight',
} as const satisfies Record<keyof typeof moments.kinds, BadgeTone>;

/**
 * Four moments, each a short exchange: two asks, one piece of feedback given unasked, and one
 * Kudos. Each shows when it happened and who leads, what they asked or gave in a bubble on the
 * lead's side, what came back in one on the other side, and the habit it shows as a note in the
 * margin. Kudos gets no reply; it is a thank-you, not a question.
 */
export function LandingMoments() {
  return (
    <LandingSection id="moments" title={moments.title} note={moments.note}>
      <ol className="flex flex-col">
        {moments.items.map((moment) => (
          <li
            key={moment.when}
            className="grid gap-5 border-border-muted border-t py-8 md:grid-cols-3 md:gap-gap-grid"
          >
            <div className="flex flex-col gap-1">
              <Text as="h3" variant="subtitle-2">
                {moment.when}
              </Text>
              <Text variant="body-1" tone="muted">
                {moment.who}
              </Text>
            </div>
            <div className="flex flex-col gap-3 md:col-span-2">
              <div className="flex max-w-11/12 flex-col gap-2 self-start rounded-page rounded-tl-element bg-action-primary-surface-hover p-4 md:max-w-4/5">
                <Badge
                  tone={KIND_TONES[moment.kind]}
                  className="bg-surface-base"
                >
                  {moments.kinds[moment.kind]}
                </Badge>
                <Text variant="body-1">{moment.said}</Text>
              </div>
              {moment.reply && (
                <div className="flex max-w-11/12 flex-col gap-2 self-end rounded-page rounded-tr-element border border-border-muted bg-surface-base p-4 md:max-w-4/5">
                  <Text as="p" variant="caption" tone="muted">
                    {moments.replyLabel}
                  </Text>
                  <Text variant="body-1">{moment.reply}</Text>
                </div>
              )}
              <HandwrittenNote tilt="left" className="mt-1">
                {moment.hint}
              </HandwrittenNote>
            </div>
          </li>
        ))}
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
