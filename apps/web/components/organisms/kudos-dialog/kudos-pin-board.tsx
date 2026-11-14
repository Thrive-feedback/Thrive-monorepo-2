import { useReducedMotion } from 'motion/react';
import { Button } from '@/components/atoms/button';
import { POSTCARD_BAR } from '@/components/organisms/postcard-dialog/postcard-editor.constant';
import { cn } from '@/lib/cn.util';
import styles from './kudos-card.module.css';
import { KudosCardFace } from './kudos-card-face';
import { shakeKudosCard } from './kudos-card-shake.util';
import {
  KUDOS_TEMPLATE_KEYS,
  type KudosTemplateKey,
} from './kudos-template.constant';

/** Where on the board the card lands: second along the top row, clear of the card it leaves. */
const LANDING_PLACE = 1;

/** Enough rows and columns to show round the large card on any screen. */
const PLACE_COUNT = 24;

/** How far each row of six moves along the templates, so no column is all one card. */
const ROW_SHIFT = 2;

/** The cards already up, each template in turn, with a place left for this one. */
const PLACES: readonly KudosTemplateKey[] = Array.from(
  { length: PLACE_COUNT },
  (_, place) => {
    const shifted = place + Math.floor(place / 6) * ROW_SHIFT;
    return (
      KUDOS_TEMPLATE_KEYS[shifted % KUDOS_TEMPLATE_KEYS.length] ??
      KUDOS_TEMPLATE_KEYS[0]
    );
  },
);

/** Cards pinned by hand are never quite straight. Whole utilities, in turn. */
const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'];

/** Shakes the card the cursor has just come onto, and not again until it leaves. */
function shakeCardUnder(event: React.PointerEvent) {
  const { target, relatedTarget, pointerType } = event;
  if (pointerType !== 'mouse' || !(target instanceof Element)) {
    return;
  }
  const neighbour = target.closest('[data-pin-neighbour]');
  const isStillOnIt =
    relatedTarget instanceof Node && neighbour?.contains(relatedTarget);
  const card = neighbour?.firstElementChild;
  if (card && !isStillOnIt) {
    shakeKudosCard(card);
  }
}

export type KudosPinBoardProps = {
  /** The card has landed, so the board can be played with. */
  isSettled: boolean;
  ref?: React.Ref<HTMLDivElement>;
};

/**
 * What a sent card is pinned to: a small board of cards with one place free, filling the window
 * behind the card, with a veil over it. Nothing here is a real Kudos; it is decoration, and the
 * Kudos board proper is where a sent card is read. `use-kudos-pin.ts` moves it. Once the card has
 * landed, a card the cursor passes over gives a little shake.
 */
export function KudosPinBoard({ isSettled, ref }: KudosPinBoardProps) {
  const reduceMotion = useReducedMotion() === true;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div
        data-pin-board
        className={cn(
          'absolute inset-0 flex items-center justify-center bg-surface-subtle',
          styles.board,
        )}
      >
        <div
          onPointerOver={
            isSettled && !reduceMotion ? shakeCardUnder : undefined
          }
          className="grid w-max grid-cols-4 gap-3 md:grid-cols-6 md:gap-4"
        >
          {PLACES.map((templateKey, place) =>
            place === LANDING_PLACE ? (
              <div
                // Each place is drawn once and none moves.
                // biome-ignore lint/suspicious/noArrayIndexKey: see above
                key={place}
                data-pin-slot
                className="aspect-3/4 w-20 rounded-element border border-border-default border-dashed md:w-28"
              />
            ) : (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: see above
                key={place}
                data-pin-neighbour
                className={cn(
                  'w-20 md:w-28',
                  TILTS[place % TILTS.length],
                  isSettled && 'pointer-events-auto',
                )}
              >
                <KudosCardFace templateKey={templateKey} />
              </div>
            ),
          )}
        </div>
      </div>
      <div data-pin-veil className={cn('absolute inset-0', styles.veil)} />
    </div>
  );
}

export type KudosPinActionsProps = {
  /** Takes the cursor when the card has landed, since everything else is out of reach by then. */
  ref?: React.Ref<HTMLButtonElement>;
  onGoToBoard: () => void;
  onBackToHome: () => void;
};

/**
 * What comes after the card is pinned, under the board. Going to the Kudos Board is what is offered
 * first. Below `lg` the bar sits high enough to clear the toast that says the Kudos went, which from
 * `md` rises at the bottom right and can reach under the middle of a narrow window; on a phone that
 * toast drops in at the top instead.
 */
export function KudosPinActions({
  ref,
  onGoToBoard,
  onBackToHome,
}: KudosPinActionsProps) {
  return (
    <div className="fixed inset-x-0 bottom-28 flex justify-center px-4 motion-safe:animate-enter lg:bottom-6">
      <div className={cn(POSTCARD_BAR, 'flex-wrap justify-center gap-1.5')}>
        <Button variant="primary" onClick={onGoToBoard} className="min-h-11">
          Go to Kudos board
        </Button>
        <Button
          ref={ref}
          variant="secondary"
          onClick={onBackToHome}
          className="min-h-11"
        >
          Back to home
        </Button>
      </div>
    </div>
  );
}

export type KudosPinProps = {
  ref?: React.Ref<HTMLSpanElement>;
};

/**
 * The pin itself, in at the last moment. It is on the card, so it lands with it and shrinks with
 * it: drawn large here, it ends up the size of a pin.
 */
export function KudosPin({ ref }: KudosPinProps) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-pin
      className={cn(
        'absolute top-1 left-1/2 size-14 -translate-x-1/2 rounded-full bg-action-primary shadow-med',
        styles.pin,
      )}
    />
  );
}
