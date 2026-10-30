import { MoveDiagonal2Icon, RotateCwIcon, XIcon } from 'lucide-react';
import { memo, useId, useRef } from 'react';
import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import type { PlacedPostcardStamp } from './postcard-draft.type';
import { PostcardPicture } from './postcard-picture';
import { postcardStamp } from './postcard-stamp.constant';

/** The stamp's usual edge, in steps of the spacing scale: 72 px. */
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

/** What a stamp may change about itself: everything but which stamp it is and its side. */
export type PostcardStampChange = Partial<
  Pick<PlacedPostcardStamp, 'x' | 'y' | 'scale' | 'rotation'>
>;

const handle =
  'absolute flex size-6 touch-none items-center justify-center rounded-full border border-action-primary bg-surface-raised text-action-primary shadow-low';

export type PostcardStampProps = {
  stamp: PlacedPostcardStamp;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, change: PostcardStampChange) => void;
  onRemove: (id: string) => void;
};

/**
 * One stamp stuck on a side of the postcard, framed in paper with a perforated edge. Pressing it
 * selects it, drawing a frame like a design tool's: drag the stamp to move it, the corner to
 * resize it, the handle below it to turn it, and × to take it off. From the keyboard the arrow
 * keys move it, plus and minus resize it, the square brackets turn it, and Delete takes it off.
 * It sits above the writing. A picture that will not load leaves the paper with the stamp's name.
 * Memoised, with callbacks that take its id: typing the message redraws no stamp.
 */
export const PostcardStamp = memo(function PostcardStamp({
  stamp,
  isSelected,
  onSelect,
  onChange,
  onRemove,
}: PostcardStampProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const hintId = useId();
  const picture = postcardStamp(stamp.stampKey);
  const name = picture.alt;

  function faceRect() {
    return rootRef.current?.offsetParent?.getBoundingClientRect();
  }

  function begin(
    kind: Gesture['kind'],
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    const face = faceRect();
    if (!face) {
      return;
    }
    // Not stopped: the press must still reach an open Stamps drawer, which closes on a press
    // outside it. The editor's own listener already leaves a stamp's press alone.
    event.currentTarget.setPointerCapture(event.pointerId);
    const centreX = face.left + (stamp.x / 100) * face.width;
    const centreY = face.top + (stamp.y / 100) * face.height;
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
    onSelect(stamp.id);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    const face = faceRect();
    if (!current || !face) {
      return;
    }
    const centreX = face.left + (stamp.x / 100) * face.width;
    const centreY = face.top + (stamp.y / 100) * face.height;
    if (current.kind === 'move') {
      onChange(stamp.id, {
        x: clamp(
          ((event.clientX - current.offsetX - face.left) / face.width) * 100,
          0,
          100,
        ),
        y: clamp(
          ((event.clientY - current.offsetY - face.top) / face.height) * 100,
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
      onChange(stamp.id, {
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
      onChange(stamp.id, { rotation: Math.round(angle) });
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
      onChange(stamp.id, {
        x: clamp(stamp.x + move.x * step, 0, 100),
        y: clamp(stamp.y + move.y * step, 0, 100),
      });
      return;
    }
    switch (event.key) {
      case '+':
      case '=':
        event.preventDefault();
        onChange(stamp.id, {
          scale: clamp(stamp.scale + SCALE_STEP, MIN_SCALE, MAX_SCALE),
        });
        return;
      case '-':
        event.preventDefault();
        onChange(stamp.id, {
          scale: clamp(stamp.scale - SCALE_STEP, MIN_SCALE, MAX_SCALE),
        });
        return;
      case '[':
        event.preventDefault();
        onChange(stamp.id, { rotation: stamp.rotation - TURN_STEP });
        return;
      case ']':
        event.preventDefault();
        onChange(stamp.id, { rotation: stamp.rotation + TURN_STEP });
        return;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        onRemove(stamp.id);
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
      className={cn('-translate-1/2 absolute', isSelected ? 'z-20' : 'z-10')}
    >
      <button
        type="button"
        aria-label={`${name} stamp`}
        aria-describedby={hintId}
        aria-pressed={isSelected}
        onPointerDown={(event) => begin('move', event)}
        onClick={() => onSelect(stamp.id)}
        onKeyDown={handleKeyDown}
        {...gestureHandlers}
        className="size-full cursor-grab touch-none active:cursor-grabbing"
      >
        {/* The perforated edge is cut by a mask, which would cut away the focus ring too, so it
            is drawn on the inside and the button keeps its own outline. */}
        {/* The lift is on a wrapper, so its shadow follows the bites the mask cuts. */}
        <span className={cn('flex size-full', styles.stampLift)}>
          <span className={cn('flex size-full', styles.stamp)}>
            <span className="relative flex size-full items-center justify-center overflow-hidden border border-border-strong">
              <PostcardPicture
                picture={picture}
                alt=""
                sizes="11.25rem"
                fallbackClassName="p-1 text-tag"
              />
            </span>
          </span>
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Arrow keys move it, plus and minus resize it, the square brackets turn
        it, and Delete takes it off.
      </span>
      {isSelected && (
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
            aria-label={`Remove the ${name} stamp`}
            onClick={() => onRemove(stamp.id)}
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
});
