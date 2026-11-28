import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/cn.util';
import { countLabel } from '@/lib/count-label.util';

/**
 * Exported so a link or button can wear a badge's look without being one. Every filled tone
 * takes the `-surface-hover` step: the plain `-surface` steps are a fifth of the lightest colour
 * and read as white, so a badge on them would show only its words.
 */
export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-chip border border-transparent',
  {
    variants: {
      /** `md` for a badge that carries a name someone has to read, such as who a message is to. */
      size: {
        sm: 'px-2.5 py-0.5 text-tag',
        md: 'px-3 py-1 text-body-2',
      },
      tone: {
        neutral: 'bg-action-neutral-surface-hover text-fg-primary',
        brand: 'bg-action-primary-surface-hover text-action-primary-fg',
        highlight: 'bg-action-secondary-surface-hover text-action-secondary-fg',
        success: 'bg-status-success-surface-hover text-status-success-fg',
        warning: 'bg-status-warning-surface-hover text-status-warning-fg',
        error: 'bg-status-error-surface-hover text-status-error-fg',
        info: 'bg-status-info-surface-hover text-status-info-fg',
        /** A count waiting on the person, such as the bell's unread number: solid, to be seen. */
        attention: 'bg-attention text-attention-fg',
        outline: 'border-border-default text-fg-primary',
      },
      /**
       * Edged in its tone's own colour, for a badge on a tinted ground such as a card in a list, where
       * the soft fill alone fades into the ground. The words keep their `-fg` colour on the fill.
       */
      edged: {
        true: '',
        false: '',
      },
      /**
       * Solid for a badge laid over something with a pattern or words of its own, such as a label
       * across a card's edge: the tone's tint is laid as an image over the base surface, so nothing
       * under the badge shows through it, as a toast lays its status over its card. Two background
       * colours on one element would leave stylesheet order to pick the winner.
       */
      solid: {
        true: 'bg-surface-base bg-linear-to-r',
        false: '',
      },
    },
    compoundVariants: [
      { edged: true, tone: 'neutral', className: 'border-border-strong' },
      { edged: true, tone: 'brand', className: 'border-action-primary-border' },
      {
        edged: true,
        tone: 'highlight',
        className: 'border-action-secondary-border',
      },
      {
        edged: true,
        tone: 'success',
        className: 'border-status-success-border',
      },
      {
        edged: true,
        tone: 'warning',
        className: 'border-status-warning-border',
      },
      { edged: true, tone: 'error', className: 'border-status-error-border' },
      { edged: true, tone: 'info', className: 'border-status-info-border' },
      { edged: true, tone: 'attention', className: 'border-attention' },
      {
        solid: true,
        tone: 'neutral',
        className:
          'from-action-neutral-surface-hover to-action-neutral-surface-hover',
      },
      {
        solid: true,
        tone: 'brand',
        className:
          'from-action-primary-surface-hover to-action-primary-surface-hover',
      },
      {
        solid: true,
        tone: 'highlight',
        className:
          'from-action-secondary-surface-hover to-action-secondary-surface-hover',
      },
      {
        solid: true,
        tone: 'success',
        className:
          'from-status-success-surface-hover to-status-success-surface-hover',
      },
      {
        solid: true,
        tone: 'warning',
        className:
          'from-status-warning-surface-hover to-status-warning-surface-hover',
      },
      {
        solid: true,
        tone: 'error',
        className:
          'from-status-error-surface-hover to-status-error-surface-hover',
      },
      {
        solid: true,
        tone: 'info',
        className:
          'from-status-info-surface-hover to-status-info-surface-hover',
      },
      {
        solid: true,
        tone: 'attention',
        className: 'from-attention to-attention',
      },
    ],
    defaultVariants: {
      tone: 'neutral',
      size: 'sm',
      edged: false,
      solid: false,
    },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export type BadgeProps = React.ComponentPropsWithRef<'span'> &
  VariantProps<typeof badgeVariants> & {
    /** Paint the badge onto its only child, such as a link. */
    asChild?: boolean;
  };

/**
 * A short label that sorts or marks the thing beside it: a level, a state, a count. The tone
 * carries meaning, so pair it with words; colour alone says nothing to someone who cannot see it.
 */
export function Badge({
  tone,
  size,
  edged,
  solid,
  asChild = false,
  className,
  ...rest
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'span';
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ tone, size, edged, solid }), className)}
      {...rest}
    />
  );
}

export type CountBadgeProps = {
  /** How many. Nothing is drawn at zero. */
  count: number;
  /**
   * What a screen reader hears after the number, as `, 3 unread`: the badge itself is hidden from
   * it, so the count is read once, in words, after whatever it sits beside. `null` where the name
   * of what it sits on already says it, such as a button labelled with the count, or where the
   * words go elsewhere, through {@link CountSaid}.
   */
  said?: string | null;
  className?: string;
};

/**
 * How many things are waiting on the person, in the red that asks for them: a small solid circle
 * with the number, stretched to a pill for `99+` past ninety-nine, and the real number in words.
 * Every count in the navigation and the bell is one of these, so they read, look and cap alike.
 */
export function CountBadge({
  count,
  said = 'unread',
  className,
}: CountBadgeProps) {
  if (count <= 0) {
    return null;
  }
  return (
    <>
      <span
        data-slot="badge"
        aria-hidden="true"
        className={cn(
          badgeVariants({ tone: 'attention' }),
          'h-5 min-w-5 rounded-full px-1 py-0 tabular-nums',
          className,
        )}
      >
        {countLabel(count)}
      </span>
      {said !== null && <SpokenCount count={count} said={said} />}
    </>
  );
}

export type CountSaidProps = {
  count: number;
  /** What a screen reader hears after the number. */
  said?: string;
};

/**
 * A {@link CountBadge}'s words alone, as `, 3 unread`, for where the badge is drawn somewhere
 * other than after the name it counts for, such as on an icon above its label.
 */
export function CountSaid({ count, said = 'unread' }: CountSaidProps) {
  if (count <= 0) {
    return null;
  }
  return <SpokenCount count={count} said={said} />;
}

/** The words both say: `, 3 unread`, for assistive technology alone. */
function SpokenCount({ count, said }: { count: number; said: string }) {
  return (
    <span className="sr-only">
      , {count} {said}
    </span>
  );
}
