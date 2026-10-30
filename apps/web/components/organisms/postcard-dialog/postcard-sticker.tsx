import { MoveDiagonal2Icon, RotateCwIcon, XIcon } from 'lucide-react';
import { memo, useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import type {
  PlacedPostcardSticker,
  PostcardAskSticker,
} from './postcard-draft.type';
import { PostcardPicture } from './postcard-picture';
import { postcardSticker } from './postcard-sticker.constant';

/** The sticker's usual edge, in steps of the spacing scale: 72 px. */
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

/** A drag under way, with where it has taken the sticker so far. */
type Gesture = { moved?: PostcardStickerChange } & (
  | { kind: 'move'; offsetX: number; offsetY: number }
  | { kind: 'resize'; startReach: number; startScale: number }
  | { kind: 'rotate' }
);

/** What a sticker may change about itself: everything but which sticker it is and its side. */
export type PostcardStickerChange = Partial<
  Pick<PlacedPostcardSticker, 'x' | 'y' | 'scale' | 'rotation'>
>;

const handle =
  'absolute flex size-6 touch-none items-center justify-center rounded-full border border-action-primary bg-surface-raised text-action-primary shadow-low';

/** Where a sticker sits on its side, how big it is and how it is turned. */
function placeOf(sticker: PostcardAskSticker): React.CSSProperties {
  const edge = `calc(var(--space-unit) * ${BASE_SIZE * sticker.scale})`;
  return {
    left: `${sticker.x}%`,
    top: `${sticker.y}%`,
    width: edge,
    height: edge,
    rotate: `${sticker.rotation}deg`,
  };
}

/** The sticker as it looks: its picture alone, with a shadow that follows its outline. */
function StickerFace({ stickerKey }: { stickerKey: string }) {
  return (
    // The files leave a clear margin round the art; this takes up all the widest one allows.
    <span className={cn('relative flex size-full scale-115', styles.lift)}>
      <PostcardPicture
        picture={postcardSticker(stickerKey)}
        alt=""
        sizes="11.25rem"
        fallbackClassName="rounded-element bg-surface-base p-1 text-tag"
      />
    </span>
  );
}

export type PostcardStickerProps = {
  sticker: PlacedPostcardSticker;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, change: PostcardStickerChange) => void;
  onRemove: (id: string) => void;
};

/**
 * One sticker stuck on a side of the postcard, a cut-out with no frame of its own, whose shadow
 * follows its outline. Pressing it selects it, drawing a frame like a design tool's: drag the sticker to move it, the corner to
 * resize it, the handle below it to turn it, and × to take it off. From the keyboard the arrow
 * keys move it, plus and minus resize it, the square brackets turn it, and Delete takes it off.
 * It sits above the writing. A picture that will not load leaves the paper with the sticker's name.
 * Memoised, with callbacks that take its id: typing the message redraws no sticker. A drag writes
 * straight to the sticker's own style and hands on where it ended, so it redraws nothing else.
 */
export const PostcardSticker = memo(function PostcardSticker({
  sticker,
  isSelected,
  onSelect,
  onChange,
  onRemove,
}: PostcardStickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const hintId = useId();
  const name = postcardSticker(sticker.stickerKey).alt;

  // Letting go of the sticker takes its handles, and with them any pointer up a drag was waiting
  // for: a second finger on the paper does this. What the drag did still counts.
  useEffect(() => {
    const moved = gesture.current?.moved;
    if (!isSelected && moved) {
      gesture.current = null;
      onChange(sticker.id, moved);
    }
  }, [isSelected, onChange, sticker.id]);

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
    // Not stopped: the press must still reach an open Stickers drawer, which closes on a press
    // outside it. The editor's own listener already leaves a sticker's press alone.
    event.currentTarget.setPointerCapture(event.pointerId);
    const centreX = face.left + (sticker.x / 100) * face.width;
    const centreY = face.top + (sticker.y / 100) * face.height;
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
        startScale: sticker.scale,
      };
    } else {
      gesture.current = { kind };
    }
    onSelect(sticker.id);
  }

  function dragTo(moved: PostcardStickerChange) {
    if (gesture.current && rootRef.current) {
      gesture.current.moved = moved;
      Object.assign(rootRef.current.style, placeOf({ ...sticker, ...moved }));
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    const face = faceRect();
    if (!current || !face) {
      return;
    }
    const centreX = face.left + (sticker.x / 100) * face.width;
    const centreY = face.top + (sticker.y / 100) * face.height;
    if (current.kind === 'move') {
      dragTo({
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
      // whichever way the sticker is turned, so it never jumps when the handle is first taken.
      const reach = Math.hypot(
        event.clientX - centreX,
        event.clientY - centreY,
      );
      dragTo({
        scale: clamp(
          (current.startScale * reach) / current.startReach,
          MIN_SCALE,
          MAX_SCALE,
        ),
      });
    } else if (current.kind === 'rotate') {
      // The handle starts straight below the centre, a quarter turn on from where `atan2`
      // counts. It sits below rather than above so a sticker in the top corner keeps it in view.
      const angle =
        (Math.atan2(event.clientY - centreY, event.clientX - centreX) * 180) /
          Math.PI -
        90;
      dragTo({ rotation: Math.round(angle) });
    }
  }

  // A drag cut short by the browser keeps what it did, like one let go.
  function handlePointerEnd() {
    const moved = gesture.current?.moved;
    gesture.current = null;
    if (moved) {
      onChange(sticker.id, moved);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const move = KEY_MOVES[event.key];
    if (move) {
      event.preventDefault();
      const step = event.shiftKey ? BIG_STEP : STEP;
      onChange(sticker.id, {
        x: clamp(sticker.x + move.x * step, 0, 100),
        y: clamp(sticker.y + move.y * step, 0, 100),
      });
      return;
    }
    switch (event.key) {
      case '+':
      case '=':
        event.preventDefault();
        onChange(sticker.id, {
          scale: clamp(sticker.scale + SCALE_STEP, MIN_SCALE, MAX_SCALE),
        });
        return;
      case '-':
        event.preventDefault();
        onChange(sticker.id, {
          scale: clamp(sticker.scale - SCALE_STEP, MIN_SCALE, MAX_SCALE),
        });
        return;
      case '[':
        event.preventDefault();
        onChange(sticker.id, { rotation: sticker.rotation - TURN_STEP });
        return;
      case ']':
        event.preventDefault();
        onChange(sticker.id, { rotation: sticker.rotation + TURN_STEP });
        return;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        onRemove(sticker.id);
        return;
    }
  }

  const gestureHandlers = {
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
  };

  return (
    <div
      ref={rootRef}
      data-sticker
      style={placeOf(sticker)}
      className={cn('-translate-1/2 absolute', isSelected ? 'z-20' : 'z-10')}
    >
      <button
        type="button"
        aria-label={`${name} sticker`}
        aria-describedby={hintId}
        aria-pressed={isSelected}
        onPointerDown={(event) => begin('move', event)}
        onClick={() => onSelect(sticker.id)}
        onKeyDown={handleKeyDown}
        {...gestureHandlers}
        className={cn(
          'peer size-full cursor-grab touch-none active:cursor-grabbing',
          isSelected && 'focus-visible:outline-hidden',
        )}
      >
        <StickerFace stickerKey={sticker.stickerKey} />
      </button>
      <span id={hintId} className="sr-only">
        Arrow keys move it, plus and minus resize it, the square brackets turn
        it, and Delete takes it off.
      </span>
      {isSelected && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-element border border-action-primary border-dashed peer-focus-visible:border-2 peer-focus-visible:border-solid"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label="Turn the sticker"
            onPointerDown={(event) => begin('rotate', event)}
            {...gestureHandlers}
            className={cn(
              handle,
              '-bottom-9 left-1/2 -translate-x-1/2 cursor-grab',
            )}
          >
            <RotateCwIcon aria-hidden className="size-3.5" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Resize the sticker"
            onPointerDown={(event) => begin('resize', event)}
            {...gestureHandlers}
            className={cn(handle, '-right-3 -bottom-3 cursor-nwse-resize')}
          >
            <MoveDiagonal2Icon aria-hidden className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Remove the ${name} sticker`}
            onClick={() => onRemove(sticker.id)}
            className={cn(
              handle,
              '-top-3 -right-3 cursor-pointer border-status-error bg-status-error text-fg-on-error',
            )}
          >
            <XIcon aria-hidden className="size-3.5" />
          </button>
        </>
      )}
    </div>
  );
});

export type PostcardStickerReadOnlyProps = {
  sticker: PostcardAskSticker;
};

/**
 * A sticker the Requester stuck on, while answering on their card: there to see and nothing more,
 * and presses pass through it, so one over the answer never gets in the way of writing it.
 */
export const PostcardStickerReadOnly = memo(function PostcardStickerReadOnly({
  sticker,
}: PostcardStickerReadOnlyProps) {
  return (
    <div
      role="img"
      aria-label={`${postcardSticker(sticker.stickerKey).alt} sticker`}
      style={placeOf(sticker)}
      className="-translate-1/2 pointer-events-none absolute z-10"
    >
      <StickerFace stickerKey={sticker.stickerKey} />
    </div>
  );
});
