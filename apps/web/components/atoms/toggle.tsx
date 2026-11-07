'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';

const toggleVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-button text-button-sm text-fg-secondary transition-colors disabled:cursor-not-allowed disabled:text-fg-disabled enabled:data-[state=off]:hover:bg-action-neutral-surface-hover enabled:data-[state=off]:hover:text-fg-primary',
  {
    variants: {
      variant: {
        default: '',
        outline: 'border border-action-neutral-border',
      },
      /**
       * The colour it takes when pressed. `default` is the brand's soft fill; the others are one set of
       * steps in each colour, so a row of chips in different colours reads as one row.
       */
      tone: {
        default:
          'data-[state=on]:bg-action-primary-surface-hover data-[state=on]:text-action-primary',
        neutral:
          'data-[state=on]:border-border-strong data-[state=on]:bg-action-neutral-surface-hover data-[state=on]:text-fg-primary',
        primary:
          'data-[state=on]:border-action-primary-border data-[state=on]:bg-action-primary-surface data-[state=on]:text-action-primary-active',
        tertiary:
          'data-[state=on]:border-action-tertiary-border data-[state=on]:bg-action-tertiary-surface data-[state=on]:text-action-tertiary',
        secondary:
          'data-[state=on]:border-action-secondary-border data-[state=on]:bg-action-secondary-surface data-[state=on]:text-action-secondary-active',
      },
      size: {
        sm: 'h-9 min-w-9 px-2',
        md: 'h-10 min-w-10 px-2.5',
        lg: 'h-12 min-w-12 px-3',
      },
    },
    compoundVariants: [
      {
        variant: 'outline',
        tone: 'default',
        className: 'data-[state=on]:border-action-primary-border',
      },
    ],
    defaultVariants: { variant: 'default', size: 'md', tone: 'default' },
  },
);

export type ToggleProps = React.ComponentPropsWithRef<
  typeof TogglePrimitive.Root
> &
  VariantProps<typeof toggleVariants>;

/**
 * A button that stays pressed: bold on, a filter on, a view chosen. It is announced as a
 * pressed or unpressed button, so its label names the thing it turns on ("Bold"), never the
 * action ("Make bold"). An icon-only toggle needs an `aria-label`.
 *
 * The heights match `Button`'s sizes, so a toggle sits level with buttons beside it.
 */
export function Toggle({
  variant,
  size,
  tone,
  className,
  ...rest
}: ToggleProps) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, tone }), className)}
      {...rest}
    />
  );
}
