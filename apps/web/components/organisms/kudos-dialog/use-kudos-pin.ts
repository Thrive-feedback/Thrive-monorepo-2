import { useAnimate, useReducedMotion } from 'motion/react';
import { useRef, useState } from 'react';
import { readMotionSteps } from '@/components/organisms/postcard-dialog/postcard-flight.util';

/** How far the card leans as it lands, and how far past its size it swings before it settles. */
const LANDED_TILT = -3;
const SWUNG_TILT = -7;
const OVERSHOOT = 1.14;
const UNDERSHOOT = 0.95;

/**
 * How far a neighbour gives as the card lands, in a share of its height, so it is the same on a
 * phone and on a wide screen.
 */
const NEIGHBOUR_GIVE = 0.05;

function centerOf(rect: DOMRect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Pinning a sent Kudos to the board. First the board comes up behind the card, blurred and under a
 * veil, with the card still in front of it; then the blur and the veil lift over exactly the time
 * the card takes to shrink and swing down into its place, so the board comes clear as it lands. The
 * card overshoots, the pin goes in, and the cards beside it give a little. It then stays there:
 * what comes next is the Giver's to choose.
 *
 * `prepare` draws the board, in the same commit that marks the card as sent, so it is there to be
 * measured when `pin` moves it. With reduced motion every step takes no time, so the card is simply
 * pinned, and the Giver reaches the same place.
 */
export function useKudosPin() {
  const [cardRef, animate] = useAnimate<HTMLDivElement>();
  const boardRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion() === true;
  const [isOnBoard, setIsOnBoard] = useState(false);

  function prepare() {
    setIsOnBoard(true);
  }

  async function pin() {
    const card = cardRef.current;
    const board = boardRef.current?.querySelector('[data-pin-board]');
    const veil = boardRef.current?.querySelector('[data-pin-veil]');
    const slot = boardRef.current?.querySelector('[data-pin-slot]');
    const pinHead = pinRef.current;
    if (!card || !board || !veil || !slot || !pinHead) {
      return;
    }
    const { duration, ease } = readMotionSteps(card);
    const paced = (seconds: number) => (reduceMotion ? 0 : seconds);
    const from = card.getBoundingClientRect();
    const to = slot.getBoundingClientRect();
    const start = centerOf(from);
    const end = centerOf(to);
    const x = end.x - start.x;
    const y = end.y - start.y;
    const scale = to.width / from.width;
    const blurred = getComputedStyle(board).filter;

    // The first scene: the board arrives, and holds long enough to be read as a board.
    await Promise.all([
      animate(
        board,
        { opacity: 1, y: [10, 0] },
        { duration: paced(duration.fast), ease: ease.out },
      ),
      animate(
        veil,
        { opacity: 1 },
        { duration: paced(duration.fast), ease: ease.out },
      ),
    ]);

    // The blur and the veil lift across the whole landing, swing and settle together.
    const landing = {
      duration: paced(duration.verySlow + duration.fast),
      delay: paced(duration.medium),
      ease: ease.inOut,
    };
    void animate(board, { filter: [blurred, 'blur(0px)'] }, landing);
    void animate(veil, { opacity: 0 }, landing);

    await animate(
      card,
      {
        x: [0, x * 0.55, x],
        y: [0, y * 0.55, y],
        rotate: [0, SWUNG_TILT, LANDED_TILT],
        scale: [1, (1 + scale) / 2, scale * OVERSHOOT],
      },
      {
        duration: paced(duration.verySlow),
        delay: paced(duration.medium),
        ease: ease.inOut,
      },
    );

    const neighbours = [
      ...(boardRef.current?.querySelectorAll('[data-pin-neighbour]') ?? []),
    ];
    await Promise.all([
      animate(
        card,
        { scale: [scale * OVERSHOOT, scale * UNDERSHOOT, scale] },
        { duration: paced(duration.fast), ease: ease.bounce },
      ),
      animate(
        pinHead,
        { opacity: 1, scale: [2, 1] },
        { duration: paced(duration.fast), ease: ease.bounce },
      ),
      ...neighbours.map((neighbour) =>
        animate(
          neighbour,
          { y: [0, neighbour.clientHeight * NEIGHBOUR_GIVE, 0] },
          { duration: paced(duration.medium), ease: ease.out },
        ),
      ),
    ]);
  }

  return { cardRef, boardRef, pinRef, isOnBoard, prepare, pin };
}
