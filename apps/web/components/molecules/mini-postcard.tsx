import { cva } from 'class-variance-authority';
import { Postmark } from '@/components/atoms/postmark';
import { cn } from '@/lib/cn.util';
import styles from './mini-postcard.module.css';

const box = cva('group/mini relative z-10 flex aspect-3/2 shrink-0', {
  variants: { size: { md: 'w-20', lg: 'w-28 lg:w-36' } },
});

const postmark = cva('absolute top-1 right-1', {
  variants: { size: { md: 'w-12', lg: 'w-16 lg:w-20' } },
});

/** One side of the drawing: lines of writing along its foot, clear of the corner. */
function MiniPostcardSide() {
  return (
    <span className="flex min-w-0 flex-1 flex-col justify-end gap-1 p-1.5">
      <span className="h-1 rounded-full bg-surface-skeleton" />
      <span className="h-1 w-2/3 rounded-full bg-surface-skeleton" />
    </span>
  );
}

export type MiniPostcardProps = {
  /** One full side, or a side halved as a request and its answer are. */
  kind: 'offered' | 'requested';
  /** When it was sent, as an ISO date, for the postmark in its corner. */
  date: string;
  /** `lg` where the postcard is what the card is for, as an Ask waiting to be answered. */
  size?: 'md' | 'lg';
  /** Whether "View postcard" shows without being hovered, as in the UI showcase. */
  isPopupShown?: boolean;
  /** What it opens is on its way: it fades and pulses, so a press does not look lost. */
  isPending?: boolean;
};

/**
 * A small landscape postcard: a drawing of what a press opens, the same for every card of a kind,
 * with the postmark of a sent card in its corner. A hover on the drawing alone gives it a small
 * shake and shows its popup, which keyboard focus on a link around it named `card-link` shows too.
 *
 * It says nothing a screen reader needs, so whatever holds it names the postcard.
 */
export function MiniPostcard({
  kind,
  date,
  size = 'md',
  isPopupShown = false,
  isPending = false,
}: MiniPostcardProps) {
  return (
    <span
      data-slot="mini-postcard"
      aria-hidden="true"
      className={cn(box({ size }), styles.box)}
    >
      <span
        data-slot="mini-postcard-face"
        data-pending={isPending || undefined}
        className={cn(
          'relative flex size-full rounded-inner border border-border-muted bg-surface-raised shadow-low',
          styles.face,
          // A pulse only shows from full opacity. With less motion wanted, a still fade says it.
          isPending &&
            'opacity-60 motion-safe:animate-pulse motion-safe:opacity-100',
        )}
      >
        <span
          data-slot="mini-postcard-sides"
          className="flex min-w-0 flex-1 divide-x divide-border-muted"
        >
          <MiniPostcardSide />
          {kind === 'requested' && <MiniPostcardSide />}
        </span>
        <span className={postmark({ size })}>
          <Postmark date={date} />
        </span>
      </span>
      <span
        className={cn(
          'pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-container bg-action-neutral px-3 py-1.5 text-body-3 text-fg-on-neutral transition-opacity ease-smooth-out group-hover/mini:opacity-100 group-focus-visible/card-link:opacity-100',
          isPopupShown ? 'opacity-100' : 'opacity-0',
        )}
      >
        View postcard
      </span>
    </span>
  );
}
