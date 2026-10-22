import { cva } from 'class-variance-authority';
import { MoveDiagonal2Icon, RotateCwIcon, XIcon } from 'lucide-react';
import { useId, useRef } from 'react';
import { cn } from '@/lib/cn.util';
import styles from './letter.module.css';
import type { LetterSide } from './letter-face';
import { STAMP_KINDS, type StampKind } from './letter-stamp-kinds.constant';

/** The mark printed on a stamp, in its letter's colour. */
export const stampMark = cva('size-1/2', {
  variants: {
    side: {
      give: 'text-action-primary',
      request: 'text-action-secondary',
    },
  },
});

/**
 * A stamp stuck on a face of the letter. Its centre is held as a share of the letter's width and
 * height, so it stays put as the letter grows; `scale` is against the stamp's usual size and
 * `rotation` is in degrees.
 */
export type PlacedStamp = {
  id: string;
  kind: StampKind;
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

/** The stamp's usual edge, in steps of the spacing scale. */
const BASE_SIZE = 18;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

/** How far one key press moves, grows or turns it; with Shift held, moving goes further. */
const STEP = 2;
const BIG_STEP = 10;
const SCALE_STEP = 0.1;
const TURN_STEP = 15;

const KEY_MOVES: Readonly<Record<string, { x: number; y: number }>> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type Gesture =
  | { kind: 'move'; offsetX: number; offsetY: number }
  | { kind: 'resize'; startReach: number; startScale: number }
  | { kind: 'rotate' };

const handle =
  'absolute flex size-6 touch-none items-center justify-center rounded-full border border-action-primary bg-surface-raised text-action-primary shadow-low';

export type LetterStampProps = {
  stamp: PlacedStamp;
  side: LetterSide;
  selected: boolean;
  onSelect: () => void;
  onChange: (change: Partial<PlacedStamp>) => void;
  onDelete: () => void;
};

/**
 * One stamp on the letter. Clicking it selects it, drawing a frame like a design tool's: drag the
 * stamp to move it, the corner to resize it, the handle below it to turn it, and × to take it
 * off. From the keyboard the arrow keys move it, plus and minus resize it, the square brackets
 * turn it, and Delete takes it off. It sits above the writing.
 */
export function LetterStamp({
  stamp,
  side,
  selected,
  onSelect,
  onChange,
  onDelete,
}: LetterStampProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const hintId = useId();
  const { label, Icon } = STAMP_KINDS[stamp.kind];

  function letterRect() {
    return rootRef.current?.offsetParent?.getBoundingClientRect();
  }

  function begin(
    kind: Gesture['kind'],
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    const letter = letterRect();
    if (!letter) {
      return;
    }
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const centreX = letter.left + (stamp.x / 100) * letter.width;
    const centreY = letter.top + (stamp.y / 100) * letter.height;
    if (kind === 'move') {
      gesture.current = {
        kind,
        offsetX: event.clientX - centreX,
        offsetY: event.clientY - centreY,
      };
    } else if (kind === 'resize') {
      gesture.current = {
        kind,
        startReach: Math.hypot(
          event.clientX - centreX,
          event.clientY - centreY,
        ),
        startScale: stamp.scale,
      };
    } else {
      gesture.current = { kind };
    }
    onSelect();
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    const letter = letterRect();
    if (!current || !letter) {
      return;
    }
    const centreX = letter.left + (stamp.x / 100) * letter.width;
    const centreY = letter.top + (stamp.y / 100) * letter.height;
    if (current.kind === 'move') {
      onChange({
        x: clamp(
          ((event.clientX - current.offsetX - letter.left) / letter.width) *
            100,
          0,
          100,
        ),
        y: clamp(
          ((event.clientY - current.offsetY - letter.top) / letter.height) *
            100,
          0,
          100,
        ),
      });
    } else if (current.kind === 'resize' && current.startReach > 0) {
      // Grows in step with how far the handle is from the centre against where it was grabbed,
      // whichever way the stamp is turned, so it never jumps when the handle is first taken.
      const reach = Math.hypot(
        event.clientX - centreX,
        event.clientY - centreY,
      );
      onChange({
        scale: clamp(
          (current.startScale * reach) / current.startReach,
          MIN_SCALE,
          MAX_SCALE,
        ),
      });
    } else if (current.kind === 'rotate') {
      // The handle starts straight below the centre, a quarter turn on from where `atan2`
      // counts. It sits below rather than above so a stamp in the top corner keeps it in view.
      const angle =
        (Math.atan2(event.clientY - centreY, event.clientX - centreX) * 180) /
          Math.PI -
        90;
      onChange({ rotation: Math.round(angle) });
    }
  }

  function handlePointerEnd() {
    gesture.current = null;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const move = KEY_MOVES[event.key];
    if (move) {
      event.preventDefault();
      const step = event.shiftKey ? BIG_STEP : STEP;
      onChange({
        x: clamp(stamp.x + move.x * step, 0, 100),
        y: clamp(stamp.y + move.y * step, 0, 100),
      });
      return;
    }
    switch (event.key) {
      case '+':
      case '=':
        event.preventDefault();
        onChange({
          scale: clamp(stamp.scale + SCALE_STEP, MIN_SCALE, MAX_SCALE),
        });
        return;
      case '-':
        event.preventDefault();
        onChange({
          scale: clamp(stamp.scale - SCALE_STEP, MIN_SCALE, MAX_SCALE),
        });
        return;
      case '[':
        event.preventDefault();
        onChange({ rotation: stamp.rotation - TURN_STEP });
        return;
      case ']':
        event.preventDefault();
        onChange({ rotation: stamp.rotation + TURN_STEP });
        return;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        onDelete();
        return;
    }
  }

  const gestureHandlers = {
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
  };
  const edge = `calc(var(--space-unit) * ${BASE_SIZE * stamp.scale})`;

  return (
    <div
      ref={rootRef}
      data-stamp
      style={{
        left: `${stamp.x}%`,
        top: `${stamp.y}%`,
        width: edge,
        height: edge,
        rotate: `${stamp.rotation}deg`,
      }}
      className={cn('-translate-1/2 absolute', selected ? 'z-20' : 'z-10')}
    >
      <button
        type="button"
        aria-label={`${label} stamp`}
        aria-describedby={hintId}
        aria-pressed={selected}
        onPointerDown={(event) => begin('move', event)}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        {...gestureHandlers}
        className="size-full cursor-grab touch-none active:cursor-grabbing"
      >
        {/* The perforated edge is cut by a mask, which would cut away the focus ring too, so it
            is drawn on the inside and the button keeps its own outline. */}
        <span className={cn('flex size-full bg-surface-raised', styles.stamp)}>
          <span className="flex size-full items-center justify-center border border-border-strong">
            <Icon aria-hidden className={stampMark({ side })} />
          </span>
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Arrow keys move it, plus and minus resize it, the square brackets turn
        it, and Delete takes it off.
      </span>
      {selected && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-element border border-action-primary border-dashed"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label="Turn the stamp"
            onPointerDown={(event) => begin('rotate', event)}
            {...gestureHandlers}
            className={cn(
              handle,
              '-bottom-10 left-1/2 -translate-x-1/2 cursor-grab',
            )}
          >
            <RotateCwIcon aria-hidden className="size-3.5" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Resize the stamp"
            onPointerDown={(event) => begin('resize', event)}
            {...gestureHandlers}
            className={cn(handle, '-right-5 -bottom-5 cursor-nwse-resize')}
          >
            <MoveDiagonal2Icon aria-hidden className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Remove the ${label} stamp`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onDelete}
            className={cn(
              handle,
              '-top-5 -right-5 cursor-pointer border-status-error bg-status-error text-fg-on-error',
            )}
          >
            <XIcon aria-hidden className="size-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
