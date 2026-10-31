import { XIcon } from 'lucide-react';
import { memo, useId } from 'react';
import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import { PostcardPicture } from './postcard-picture';
import { postcardStamp } from './postcard-stamp.constant';

/** The stamp's place: 96 px, 5 px from the card's edges. The writing keeps clear of this square. */
const CORNER = 'absolute top-1.25 right-1.25 size-24';

/** The box printed in that place while no stamp is on it, with its one word in the middle. */
const BOX =
  'flex items-center justify-center border border-border-strong border-dashed font-display text-body-3 text-fg-secondary';

/** The stamp as it looks: its picture in a paper frame with a perforated edge. */
function StampFace({ stampKey }: { stampKey: string }) {
  return (
    // The perforated edge is cut by a mask, which would cut away a focus ring too, so it is drawn
    // on the inside, and whatever holds it keeps its own outline. The lift is on a wrapper, so its
    // shadow follows the bites the mask cuts.
    <span className={cn('flex size-full', styles.lift)}>
      <span className={cn('flex size-full', styles.stamp)}>
        <span className="relative flex size-full items-center justify-center overflow-hidden border border-border-strong">
          <PostcardPicture
            picture={postcardStamp(stampKey)}
            alt=""
            sizes="6rem"
            fallbackClassName="p-1 text-tag"
          />
        </span>
      </span>
    </span>
  );
}

export type PostcardStampProps = {
  /** Which stamp: a key from `POSTCARD_STAMPS`. */
  stampKey: string;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
};

/**
 * The one stamp on a card, framed in paper with a perforated edge, upright in the top-right corner
 * of the back. Its place, size and angle are the card's, so it can only be swapped or taken off.
 * Pressing it selects it, which shows × to take it off; from the keyboard Delete does the same.
 * Memoised: typing the message redraws no stamp.
 */
export const PostcardStamp = memo(function PostcardStamp({
  stampKey,
  isSelected,
  onSelect,
  onRemove,
}: PostcardStampProps) {
  const hintId = useId();
  const picture = postcardStamp(stampKey);
  const name = picture.alt;

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onRemove();
    }
  }

  return (
    <div data-stamp className={cn(CORNER, 'z-10')}>
      <button
        type="button"
        aria-label={`${name} stamp`}
        aria-describedby={hintId}
        aria-pressed={isSelected}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        className={cn(
          'peer size-full cursor-pointer',
          isSelected && 'focus-visible:outline-hidden',
        )}
      >
        <StampFace stampKey={stampKey} />
      </button>
      <span id={hintId} className="sr-only">
        Delete takes it off.
      </span>
      {isSelected && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-element border border-action-primary border-dashed peer-focus-visible:border-2 peer-focus-visible:border-solid"
          />
          <button
            type="button"
            aria-label={`Remove the ${name} stamp`}
            onClick={onRemove}
            className="absolute -bottom-4 -left-4 flex size-6 cursor-pointer items-center justify-center rounded-full border border-status-error bg-status-error text-fg-on-error shadow-low"
          >
            <XIcon aria-hidden className="size-3.5" />
          </button>
        </>
      )}
    </div>
  );
});

export type PostcardStampReadOnlyProps = {
  /** Which stamp: a key from `POSTCARD_STAMPS`. */
  stampKey: string;
};

/** A stamp nobody can change, such as the Requester's while answering: there to see, and nothing more. */
export const PostcardStampReadOnly = memo(function PostcardStampReadOnly({
  stampKey,
}: PostcardStampReadOnlyProps) {
  return (
    <div
      role="img"
      aria-label={`${postcardStamp(stampKey).alt} stamp`}
      className={cn(CORNER, 'pointer-events-none z-10')}
    >
      <StampFace stampKey={stampKey} />
    </div>
  );
});

/** The box printed on a card sent with no stamp: as it was while writing, but part of the paper. */
export const PostcardStampBoxReadOnly = memo(
  function PostcardStampBoxReadOnly() {
    return (
      <div aria-hidden="true" className={cn(CORNER, BOX)}>
        Stamp
      </div>
    );
  },
);

export type PostcardStampBoxProps = {
  onChoose: () => void;
};

/**
 * The stamp box printed in the corner of the back while no stamp is on it, with the word in it, as
 * on a real postcard, so the space kept clear of the writing reads as meant. Pressing it opens the
 * stamps.
 */
export const PostcardStampBox = memo(function PostcardStampBox({
  onChoose,
}: PostcardStampBoxProps) {
  return (
    <button
      type="button"
      aria-label="Choose a stamp"
      onClick={onChoose}
      className={cn(
        CORNER,
        BOX,
        'cursor-pointer transition-colors ease-smooth-out hover:border-action-primary hover:text-action-primary',
      )}
    >
      Stamp
    </button>
  );
});
