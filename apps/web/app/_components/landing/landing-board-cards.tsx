'use client';

import { PinIcon } from 'lucide-react';
import { Text } from '@/components/atoms/text';
import { kudosCardDate } from '@/components/organisms/kudos-dialog/kudos-card.util';
import { KudosCardReadOnly } from '@/components/organisms/kudos-dialog/kudos-card-read-only';
import { kudosTiltOf } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { cn } from '@/lib/cn.util';
import { NO_TEXT_TAGS, type TextTags } from '@/lib/feedback/text-tags.type';
import styles from './landing.module.css';
import { LANDING_COPY } from './landing-copy.constant';
import { useLandingPost } from './landing-post';
import { BOARD_KUDOS, type LandingKudos } from './landing-team.mock';

const { board } = LANDING_COPY;

/** "Ploy Srisuk and Ben Carter": names as a sentence says them, no Oxford comma. */
const NAMES = new Intl.ListFormat('en-GB', {
  style: 'long',
  type: 'conjunction',
});

/** Who it is from and for, under the card, as the app's board captions it. */
function captionOf(kudos: LandingKudos): string {
  const to =
    kudos.recipients.length === 0
      ? board.everyone
      : NAMES.format(kudos.recipients.map((person) => person.name ?? ''));
  return `${board.from} ${kudos.giver.name ?? ''} ${board.to} ${to}`;
}

type PinnedCardProps = {
  kudos: LandingKudos;
  tags: TextTags;
  /** Written by the visitor on the desk, so labelled as theirs and nobody else's. */
  isYours?: boolean;
  ref?: React.Ref<HTMLLIElement>;
};

/** One Kudos pinned to the board, a few degrees off square as the app's board hangs it. */
function PinnedCard({ kudos, tags, isYours = false, ref }: PinnedCardProps) {
  return (
    <li
      ref={ref}
      tabIndex={isYours ? -1 : undefined}
      className="flex flex-col items-center gap-3 rounded-element"
    >
      <figure className="flex w-full max-w-64 flex-col items-center gap-3">
        <div
          className={cn('relative w-full', styles.pinned)}
          style={{ rotate: `${kudosTiltOf(kudos.id)}deg` }}
        >
          <div className="overflow-hidden rounded-element shadow-high">
            <KudosCardReadOnly
              message={kudos.message}
              tags={tags}
              drawing={kudos.drawing}
              date={kudosCardDate(kudos.givenAt)}
            />
          </div>
          {isYours && (
            <Text
              as="span"
              variant="body-3"
              className={cn(
                'absolute inset-x-0 -top-3 mx-auto flex w-fit items-center gap-1 bg-surface-base px-3 py-1 font-medium text-action-secondary-active',
                styles.tape,
              )}
            >
              <PinIcon aria-hidden="true" className="size-4" />
              {board.yours}
            </Text>
          )}
        </div>
        <figcaption>
          <Text as="span" variant="body-3" tone="muted">
            {captionOf(kudos)}
          </Text>
        </figcaption>
      </figure>
    </li>
  );
}

/**
 * The made-up team's board, with whatever the visitor pinned from the desk first. The newest of
 * theirs is where "Go to Kudos board" takes focus.
 */
export function LandingBoardCards() {
  const { pinned, newestPinRef } = useLandingPost();

  return (
    // The board's edge, as the app's `/kudos` board draws it (`KUDOS_BOARD_EDGE`, route-private
    // there): a hairline round a page-cornered board, with room inside so no card or tape meets it.
    <ul className="grid grid-cols-2 gap-x-6 gap-y-10 rounded-page border border-border-muted px-4 pt-8 pb-6 md:grid-cols-3 md:gap-x-gap-grid md:px-10 md:pt-12 md:pb-10 lg:gap-x-16">
      {pinned.map((kudos, index) => (
        <PinnedCard
          key={kudos.id}
          kudos={kudos}
          tags={kudos.tags}
          isYours
          ref={index === 0 ? newestPinRef : undefined}
        />
      ))}
      {BOARD_KUDOS.map((kudos) => (
        <PinnedCard key={kudos.id} kudos={kudos} tags={NO_TEXT_TAGS} />
      ))}
    </ul>
  );
}
