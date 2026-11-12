import { Logo } from '@/components/atoms/logo';
import { Text } from '@/components/atoms/text';
import {
  FeedCardRow,
  FeedCardSurface,
} from '@/components/organisms/feed-card/feed-card-columns';
import type { FeedCardTone } from '@/components/organisms/feed-card/feed-card-tone.type';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingPostcardSmall } from './landing-moment-card';
import { LandingSection } from './landing-section';
import { DESK_CARDS, MOMENT_CARDS } from './landing-team.mock';

const { why } = LANDING_COPY;

/**
 * Each reason in one of the three voices, as cards in the app's lists are told apart, beside the
 * postcard that shows what Thrive does about it: an Ask sent the morning it was about, Feedback
 * written for one person only, and an Ask about one moment and one thing to try.
 */
const CARDS = [
  { tone: 'primary', card: MOMENT_CARDS[0] },
  { tone: 'tertiary', card: DESK_CARDS.give },
  { tone: 'secondary', card: DESK_CARDS.ask },
] as const satisfies readonly { tone: FeedCardTone; card: unknown }[];

/**
 * Why feedback goes missing, three reasons, each on a card as the app's lists draw one and read as
 * an answered card is: the reason and what it costs in a panel of its own, then, under Thrive's
 * name, what Thrive does about it. In the column beside them, parted by a line in the page's
 * colour, the postcard that does it, made small, with a note by hand pointing at it. The postcard
 * is a picture of the words beside it, so assistive technology skips it. It argues from the
 * situation, not from studies: the page cites no research.
 */
export function LandingWhy() {
  return (
    <LandingSection
      id="why"
      title={why.title}
      note={why.note}
      lead={why.lead}
      align="center"
    >
      <ul className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {why.reasons.map((reason, index) => {
          const { tone, card } = CARDS[index % CARDS.length] ?? CARDS[0];
          return (
            // The page's own ground under each card, as the app's lists stand on it, so the
            // card's tint reads the same on this band as there.
            <li key={reason.title} className="rounded-page bg-surface-base">
              <FeedCardSurface tone={tone}>
                <FeedCardRow
                  tone={tone}
                  note={reason.note}
                  aside={<LandingPostcardSmall card={card} />}
                >
                  <div className="flex flex-col gap-1 rounded-control bg-surface-base/70 px-3 py-2">
                    <Text as="h3" variant="subtitle-3">
                      {reason.title}
                    </Text>
                    <Text variant="body-2" tone="muted" className="text-pretty">
                      {reason.body}
                    </Text>
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5">
                    <Logo className="aspect-10/3 h-auto w-16" />
                    <Text variant="body-1" className="text-pretty">
                      {reason.inThrive}
                    </Text>
                  </div>
                </FeedCardRow>
              </FeedCardSurface>
            </li>
          );
        })}
      </ul>
      <Text
        variant="subtitle-display-1"
        className="mx-auto max-w-2xl text-balance text-center"
      >
        {why.closer}
      </Text>
    </LandingSection>
  );
}
