import { useRef } from 'react';

/** How far a finger goes before it counts as moving the board rather than resting on it. */
const SLOP = 8;

/** How much of the board's width a swipe has to cover to turn the page. */
const TURNING_SHARE = 0.2;

/** How far the board comes with a finger when there is no page that way. */
const STIFFNESS_AT_THE_END = 0.25;

type Swipe = {
  pointerId: number;
  startX: number;
  startY: number;
  isMoving: boolean;
  dx: number;
};

export type UseKudosBoardSwipeOptions = {
  trackRef: React.RefObject<HTMLElement | null>;
  canGoBack: boolean;
  canGoOn: boolean;
  onStart: () => void;
  onGoBack: () => void;
  onGoOn: () => void;
};

/**
 * Turns the board's pages with a finger. The board follows it, written straight to the strip's own
 * style so a swipe redraws nothing, and `touch-pan-y` on the board leaves an upward swipe to the
 * page's own scrolling, which takes the pointer away with `pointercancel`. A mouse is left alone:
 * there it moves a card.
 */
export function useKudosBoardSwipe({
  trackRef,
  canGoBack,
  canGoOn,
  onStart,
  onGoBack,
  onGoOn,
}: UseKudosBoardSwipeOptions) {
  const swipe = useRef<Swipe | null>(null);

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'touch' || swipe.current) {
      return;
    }
    swipe.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      isMoving: false,
      dx: 0,
    };
    onStart();
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const current = swipe.current;
    const track = trackRef.current;
    if (!current || !track || event.pointerId !== current.pointerId) {
      return;
    }
    const dx = event.clientX - current.startX;
    if (!current.isMoving) {
      if (Math.abs(dx) < SLOP) {
        return;
      }
      current.isMoving = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      track.dataset.swiping = '';
    }
    const hasPageThatWay = dx < 0 ? canGoOn : canGoBack;
    current.dx = dx;
    track.style.setProperty(
      '--kudos-board-swipe',
      `${hasPageThatWay ? dx : dx * STIFFNESS_AT_THE_END}px`,
    );
  }

  function letGo(event: React.PointerEvent<HTMLElement>, canTurn: boolean) {
    const current = swipe.current;
    const track = trackRef.current;
    if (!current || !track || event.pointerId !== current.pointerId) {
      return;
    }
    swipe.current = null;
    if (!current.isMoving) {
      return;
    }
    delete track.dataset.swiping;
    track.style.removeProperty('--kudos-board-swipe');
    const reach = track.offsetWidth * TURNING_SHARE;
    if (canTurn && current.dx <= -reach) {
      onGoOn();
    } else if (canTurn && current.dx >= reach) {
      onGoBack();
    }
  }

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => letGo(event, true),
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) =>
      letGo(event, false),
  };
}
