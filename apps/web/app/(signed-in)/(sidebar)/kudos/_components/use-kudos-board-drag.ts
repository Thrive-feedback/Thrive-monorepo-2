import { useCallback, useEffect, useRef } from 'react';
import type { KudosBoardOffset } from './kudos-board-places';

/** How far one key press moves a card; with Shift held, further. */
const STEP = 24;
const BIG_STEP = 96;

/** How long a press waits for a second one, in milliseconds. */
const DOUBLE_PRESS = 350;

/** Above every card already moved, however many have been. */
const IN_THE_HAND = 1_000_000;

const KEY_MOVES: Readonly<Record<string, KudosBoardOffset>> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

type Limits = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  from: KudosBoardOffset;
  limits: Limits;
  /** What the card's own stacking was, to go back to as it is let go. */
  zIndex: string;
  moved: KudosBoardOffset | null;
};

/**
 * How far a card now `at` this offset can go and stay on the board, in offsets: inside its edge by
 * as much as the cards hang in from it, so a card in the hand never meets the edge or has its shadow
 * cut there. That inset is read from where the strip of pages starts below the board's top, since
 * the strip moves sideways as pages turn but never up or down.
 */
function limitsOf(
  card: HTMLElement,
  board: HTMLElement,
  at: KudosBoardOffset,
): Limits {
  const cardBox = card.getBoundingClientRect();
  const boardBox = board.getBoundingClientRect();
  const track = card.closest('[data-kudos-board-track]');
  const inset = track ? track.getBoundingClientRect().top - boardBox.top : 0;
  return {
    minX: at.x - (cardBox.left - boardBox.left - inset),
    maxX: at.x + (boardBox.right - inset - cardBox.right),
    minY: at.y - (cardBox.top - boardBox.top - inset),
    maxY: at.y + (boardBox.bottom - inset - cardBox.bottom),
  };
}

function kept(offset: KudosBoardOffset, limits: Limits): KudosBoardOffset {
  return {
    x: Math.min(limits.maxX, Math.max(limits.minX, offset.x)),
    y: Math.min(limits.maxY, Math.max(limits.minY, offset.y)),
  };
}

export type UseKudosBoardDragOptions = {
  cardRef: React.RefObject<HTMLElement | null>;
  boardRef: React.RefObject<HTMLElement | null>;
  /** Where the card is now. */
  offset: KudosBoardOffset;
  onMove: (offset: KudosBoardOffset) => void;
  /** One press: read it large. */
  onOpen: () => void;
  /** Two presses in a row: turn it over where it hangs. */
  onTurn: () => void;
};

/**
 * Moves a card with the mouse or the arrow keys, anywhere on the board and no further, opens it on a
 * press and turns it over on a double press. A drag
 * writes straight to the card's own style and hands on where it ended, so it redraws nothing else,
 * as a sticker's does. A finger is left alone: on a phone a card stays where it hangs.
 */
export function useKudosBoardDrag({
  cardRef,
  boardRef,
  offset,
  onMove,
  onOpen,
  onTurn,
}: UseKudosBoardDragOptions) {
  const gesture = useRef<Gesture | null>(null);
  const hasDragged = useRef(false);
  const pressWaiting = useRef<ReturnType<typeof setTimeout> | null>(null);

  const forgetPress = useCallback(() => {
    if (pressWaiting.current !== null) {
      clearTimeout(pressWaiting.current);
      pressWaiting.current = null;
    }
  }, []);

  useEffect(() => forgetPress, [forgetPress]);

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    hasDragged.current = false;
    const card = cardRef.current;
    const board = boardRef.current;
    if (
      !card ||
      !board ||
      event.button !== 0 ||
      event.pointerType === 'touch'
    ) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      from: offset,
      limits: limitsOf(card, board, offset),
      zIndex: card.style.zIndex,
      moved: null,
    };
    card.dataset.held = '';
    card.style.zIndex = String(IN_THE_HAND);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const held = gesture.current;
    const card = cardRef.current;
    if (!held || !card || event.pointerId !== held.pointerId) {
      return;
    }
    held.moved = kept(
      {
        x: held.from.x + event.clientX - held.startX,
        y: held.from.y + event.clientY - held.startY,
      },
      held.limits,
    );
    card.style.translate = `${held.moved.x}px ${held.moved.y}px`;
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLButtonElement>) {
    const held = gesture.current;
    const card = cardRef.current;
    if (!held || !card || event.pointerId !== held.pointerId) {
      return;
    }
    gesture.current = null;
    delete card.dataset.held;
    card.style.zIndex = held.zIndex;
    if (held.moved) {
      hasDragged.current = true;
      forgetPress();
      onMove(held.moved);
    }
  }

  /**
   * One press opens the card and two in a row turn it over, with a mouse or a finger, so a press has
   * to wait to see which it is. Timed here rather than left to `dblclick`, which not every phone
   * sends. Enter and Space have no second press to wait for, and are the only ones with no click
   * count, `detail`. The press that ends a drag is not a press at all.
   */
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }
    if (event.detail === 0) {
      onOpen();
    } else if (pressWaiting.current !== null) {
      forgetPress();
      onTurn();
    } else {
      pressWaiting.current = setTimeout(() => {
        pressWaiting.current = null;
        onOpen();
      }, DOUBLE_PRESS);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const move = KEY_MOVES[event.key];
    const card = cardRef.current;
    const board = boardRef.current;
    if (!move || !card || !board) {
      return;
    }
    event.preventDefault();
    const step = event.shiftKey ? BIG_STEP : STEP;
    onMove(
      kept(
        { x: offset.x + move.x * step, y: offset.y + move.y * step },
        limitsOf(card, board, offset),
      ),
    );
  }

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
  };
}
