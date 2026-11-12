'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HeartIcon,
  MessageCircleQuestionIcon,
  PenLineIcon,
} from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { Badge, type BadgeTone } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { kudosCardDate } from '@/components/organisms/kudos-dialog/kudos-card.util';
import { KudosCardReadOnly } from '@/components/organisms/kudos-dialog/kudos-card-read-only';
import { cn } from '@/lib/cn.util';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import styles from './landing.module.css';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingPostcardScaled } from './landing-moment-card';
import { type DeskCard, useLandingPost } from './landing-post';
import { DESK_CARDS } from './landing-team.mock';

const { desk } = LANDING_COPY;

/** The cards in the order they are read: the fan turns them, but never reorders them. */
const CARDS = ['ask', 'kudos', 'give'] as const satisfies readonly DeskCard[];

/**
 * Each card's width, as a share of the desk, and its voice: the hue of the act it is for (blue
 * asks, orange thanks, plum gives). A postcard lies wide; a Kudos card stands upright.
 */
const LOOKS = {
  ask: {
    width: 'w-3/5 md:w-1/2',
    tone: 'info',
    Icon: MessageCircleQuestionIcon,
  },
  kudos: { width: 'w-2/5 md:w-1/3', tone: 'highlight', Icon: HeartIcon },
  give: { width: 'w-3/5 md:w-1/2', tone: 'brand', Icon: PenLineIcon },
} as const satisfies Record<
  DeskCard,
  { width: string; tone: BadgeTone; Icon: typeof HeartIcon }
>;

/**
 * The three places in the fan: one card in front, full size and square to the page, and one
 * either side of it, smaller and leaning away, tucked behind it.
 */
const PLACES = [
  { place: styles.fanLeft, lean: styles.leanLeft },
  { place: styles.fanFront, lean: styles.deskFront },
  { place: styles.fanRight, lean: styles.leanRight },
] as const;

/** Where a card lies once `front` is the card in front: 0 left, 1 in front, 2 right. */
function placeOf(index: number, front: number): number {
  return (index - front + CARDS.length + 1) % CARDS.length;
}

/**
 * How long an element's transitions take to finish, in milliseconds: none under reduced motion,
 * where the stylesheet turns them off. Computed styles give every duration in seconds.
 */
function transitionTime(element: Element): number {
  const { transitionDuration, transitionDelay } = getComputedStyle(element);
  const seconds = (list: string) =>
    list.split(',').map((value) => Number.parseFloat(value) || 0);
  const delays = seconds(transitionDelay);
  return (
    Math.max(
      0,
      ...seconds(transitionDuration).map(
        (duration, at) => duration + (delays[at] ?? 0),
      ),
    ) * 1000
  );
}

/**
 * The card itself, as it lies: a real postcard or Kudos card, drawn small. It depends on which card
 * alone, so turning the fan or opening a dialog never draws it again.
 */
const CardOnDesk = memo(function CardOnDesk({ card }: { card: DeskCard }) {
  if (card === 'kudos') {
    const { kudos } = DESK_CARDS;
    return (
      <span aria-hidden="true" inert className="block">
        <KudosCardReadOnly
          message={kudos.message}
          tags={NO_TEXT_TAGS}
          drawing={kudos.drawing}
          date={kudosCardDate(kudos.givenAt)}
        />
      </span>
    );
  }
  return <LandingPostcardScaled card={DESK_CARDS[card]} />;
});

/**
 * Three real cards fanned under the promise: the Kudos in front to begin with, an answered Ask and
 * Feedback given unasked behind it either side, both turned to their written backs. The arrows
 * turn the fan, bringing the card on that side to the front. Each card is a button that opens the
 * dialog the app writes it in, a card at the side once it has turned to the front; a label on each says what writing it does, and names the button.
 * What the visitor writes goes nowhere: the caption says so.
 */
export function LandingDesk() {
  const { write, cancel, warm } = useLandingPost();
  const [front, setFront] = useState(CARDS.indexOf('kudos'));

  // A card picked from the side opens once it has turned to the front; picking again, or
  // leaving the page, forgets the one still turning.
  const opening = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(opening.current), []);

  const inFront = CARDS[front] ?? 'kudos';

  function handleTurn(by: 1 | -1) {
    // Turning away forgets a card picked a moment ago, whether it is still turning or its dialog
    // is still on its way.
    window.clearTimeout(opening.current);
    cancel();
    setFront((current) => (current + by + CARDS.length) % CARDS.length);
  }

  /** The card in front opens at once; one at the side turns to the front first, then opens. */
  function handlePick(
    card: DeskCard,
    index: number,
    button: HTMLButtonElement,
  ) {
    window.clearTimeout(opening.current);
    if (index === front) {
      write(card);
      return;
    }
    setFront(index);
    const place = button.closest('li');
    opening.current = window.setTimeout(
      () => write(card),
      place ? transitionTime(place) : 0,
    );
  }

  return (
    <section
      aria-labelledby="desk-title"
      className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6"
    >
      <h2 id="desk-title" className="sr-only">
        {desk.title}
      </h2>
      <ul className="@container relative aspect-4/3 w-full md:aspect-2/1">
        {CARDS.map((card, index) => {
          const { width, tone, Icon } = LOOKS[card];
          const where = placeOf(index, front);
          const { place, lean } = PLACES[where] ?? PLACES[1];
          return (
            <li
              key={card}
              className={cn(
                'absolute top-1/2 left-1/2',
                styles.fanCard,
                place,
                width,
              )}
            >
              <button
                type="button"
                // The card is a picture and the label is its name; said once, so the card's own
                // words never run on into it.
                aria-label={desk.cards[card]}
                className={cn(
                  'group relative block w-full cursor-pointer rounded-element',
                  styles.deskCard,
                  lean,
                )}
                onClick={(event) =>
                  handlePick(card, index, event.currentTarget)
                }
                onPointerEnter={() => warm(card)}
                onFocus={() => warm(card)}
              >
                <span className="block rounded-element shadow-high">
                  <CardOnDesk card={card} />
                </span>
                <Badge
                  tone={tone}
                  size="md"
                  edged
                  solid
                  // On the card to the right, the label sits at its right corner, clear of the
                  // card in front of it. On a phone a card behind shows too little of itself for
                  // its words, so its label keeps the picture alone until it comes to the front;
                  // the button's name says the rest.
                  className={cn(
                    'absolute -top-3 gap-1.5 shadow-low',
                    where === 2 ? 'right-4' : 'left-4',
                  )}
                >
                  <Icon aria-hidden="true" className="size-3.5" />
                  <span className={cn(where !== 1 && 'hidden sm:inline')}>
                    {desk.cards[card]}
                  </span>
                </Badge>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-4 sm:gap-8">
        <Button
          size="icon"
          aria-label={desk.previous}
          onClick={() => handleTurn(-1)}
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
        </Button>
        {/*
         * Between the arrows, the kind of card in front, written by hand. The note is a picture
         * to assistive technology, so the same words are said once more, and again whenever the
         * fan turns: the arrows change nothing else a screen reader would notice.
         */}
        <div className="flex flex-col items-center gap-1 text-center">
          {/* Written afresh whenever the fan turns, so a new name is never caught half written. */}
          <HandwrittenNote
            key={inFront}
            tilt="left"
            writes="on-open"
            className="text-action-tertiary md:text-display-4"
          >
            {desk.cards[inFront]}
          </HandwrittenNote>
          <p aria-live="polite" className="sr-only">
            {desk.cards[inFront]}
          </p>
          <Text variant="body-3" tone="muted">
            {desk.caption}
          </Text>
        </div>
        <Button
          size="icon"
          aria-label={desk.next}
          onClick={() => handleTurn(1)}
        >
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </section>
  );
}
