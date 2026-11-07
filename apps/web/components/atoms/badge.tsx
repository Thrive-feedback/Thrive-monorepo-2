import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/cn.util';

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
    ],
    defaultVariants: { tone: 'neutral', size: 'sm', edged: false },
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
  asChild = false,
  className,
  ...rest
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'span';
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ tone, size, edged }), className)}
      {...rest}
    />
  );
}
