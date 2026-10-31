import { cn } from '@/lib/cn.util';
import styles from './mini-postcard.module.css';

/** One side of the drawing: lines of writing along its foot, clear of the corner. */
function MiniPostcardSide() {
  return (
    <span className="flex min-w-0 flex-1 flex-col justify-end gap-1 p-1.5">
      <span className="h-1 rounded-full bg-surface-skeleton" />
      <span className="h-1 w-2/3 rounded-full bg-surface-skeleton" />
    </span>
  );
}

/** The blue mark a sent postcard carries, drawn small: a ring saying who posted it, and waves. */
function MiniPostcardMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 112 64"
      className="absolute top-1 right-1 w-12 text-status-info"
    >
      <g className="fill-none stroke-current stroke-2">
        <circle cx="84" cy="32" r="26" />
        <circle cx="84" cy="32" r="21" />
        <path d="M0 22 q7 -5 14 0 t14 0 t14 0 t14 0" />
        <path d="M0 32 q7 -5 14 0 t14 0 t14 0 t14 0" />
        <path d="M0 42 q7 -5 14 0 t14 0 t14 0 t14 0" />
      </g>
      <text
        x="84"
        y="30"
        textAnchor="middle"
        className="fill-current font-display text-tag"
      >
        THRIVE
      </text>
      <text
        x="84"
        y="42"
        textAnchor="middle"
        className="fill-current font-display text-tag"
      >
        POST
      </text>
    </svg>
  );
}

export type MiniPostcardProps = {
  /** One full side, or a side halved as a request and its answer are. */
  kind: 'offered' | 'requested';
  /** Whether "View postcard" shows without being hovered, as in the UI showcase. */
  isPopupShown?: boolean;
};

/**
 * A small landscape postcard: a drawing of what a press opens, the same for every card of a kind,
 * with the blue mark of a sent card in its corner. A hover on the drawing alone gives it a small
 * shake and shows its popup, which keyboard focus on a link around it named `card-link` shows too.
 *
 * It says nothing a screen reader needs, so whatever holds it names the postcard.
 */
export function MiniPostcard({
  kind,
  isPopupShown = false,
}: MiniPostcardProps) {
  return (
    <span
      data-slot="mini-postcard"
      aria-hidden="true"
      className={cn(
        'group/mini relative z-10 flex aspect-3/2 w-20 shrink-0',
        styles.box,
      )}
    >
      <span
        data-slot="mini-postcard-face"
        className={cn(
          'relative flex size-full rounded-inner border border-border-muted bg-surface-raised shadow-low',
          styles.face,
        )}
      >
        <span
          data-slot="mini-postcard-sides"
          className="flex min-w-0 flex-1 divide-x divide-border-muted"
        >
          <MiniPostcardSide />
          {kind === 'requested' && <MiniPostcardSide />}
        </span>
        <MiniPostcardMark />
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
