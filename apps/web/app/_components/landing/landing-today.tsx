import {
  BarChart3Icon,
  EyeIcon,
  HeartIcon,
  MessageCircleIcon,
  MessageCircleQuestionIcon,
  PenLineIcon,
} from 'lucide-react';
import { Text } from '@/components/atoms/text';
import { FEED_CARD_SURFACE } from '@/components/organisms/feed-card/feed-card-surface.constant';
import {
  FEED_CARD_GROUND,
  FEED_CARD_INK,
} from '@/components/organisms/feed-card/feed-card-tone.constant';
import { cn } from '@/lib/cn.util';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';

const { today } = LANDING_COPY;

type Voice = (typeof today.features)[number]['voice'];

/**
 * Each card in the colour of the act it names, as the app's lists colour a card by its kind: blue
 * asks, plum gives, orange thanks. What is not an act, the tools around them, stands on plain
 * paper with a hairline edge.
 */
const LOOKS = {
  ask: { ground: FEED_CARD_GROUND.tertiary, ink: FEED_CARD_INK.tertiary },
  give: { ground: FEED_CARD_GROUND.primary, ink: FEED_CARD_INK.primary },
  thanks: { ground: FEED_CARD_GROUND.secondary, ink: FEED_CARD_INK.secondary },
  paper: {
    ground: 'border border-border-muted bg-surface-base',
    ink: 'text-fg-secondary',
  },
} as const satisfies Record<Voice, { ground: string; ink: string }>;

/** The picture on each card, in the order the features are listed. */
const ICONS = [
  MessageCircleQuestionIcon,
  PenLineIcon,
  HeartIcon,
  EyeIcon,
  MessageCircleIcon,
  BarChart3Icon,
] as const;

/**
 * What a team can do in Thrive, six things in `ADR-0038`'s order, each on a card as the app's lists
 * draw one: its act's tint, a line icon in its ink, the name and what it is for. Kudos, Discord and
 * Insights are listed although not all of them are built yet, chosen knowingly there; each is
 * described only by what it is for, never by where it sits or how fast it is.
 */
export function LandingToday() {
  return (
    <LandingSection id="today" title={today.title} note={today.note}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {today.features.map((feature, index) => {
          const Icon = ICONS[index] ?? HeartIcon;
          const { ground, ink } = LOOKS[feature.voice];
          return (
            // The page's own ground under each card, as the app's lists stand on it, so a tint
            // reads the same here as there and the colours behind the page stay behind it.
            <li key={feature.title} className="rounded-page bg-surface-base">
              <article className={cn(FEED_CARD_SURFACE, ground, 'h-full')}>
                <Icon
                  aria-hidden="true"
                  className={cn('size-6', ink)}
                  strokeWidth={1.75}
                />
                <div className="flex flex-col gap-1">
                  <Text as="h3" variant="subtitle-2">
                    {feature.title}
                  </Text>
                  <Text variant="body-2" tone="muted" className="text-pretty">
                    {feature.body}
                  </Text>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </LandingSection>
  );
}
