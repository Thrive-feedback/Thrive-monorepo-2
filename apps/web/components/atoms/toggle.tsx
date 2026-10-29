'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';

const toggleVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-button text-button-sm text-fg-secondary transition-colors enabled:hover:bg-action-neutral-surface-hover enabled:hover:text-fg-primary disabled:cursor-not-allowed disabled:text-fg-disabled data-[state=on]:bg-action-primary-surface-hover data-[state=on]:text-action-primary',
  {
    variants: {
      variant: {
        default: '',
        outline:
          'border border-action-neutral-border data-[state=on]:border-action-primary-border',
      },
      size: {
        sm: 'h-9 min-w-9 px-2',
        md: 'h-10 min-w-10 px-2.5',
        lg: 'h-12 min-w-12 px-3',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
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
export function Toggle({ variant, size, className, ...rest }: ToggleProps) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size }), className)}
      {...rest}
    />
  );
}
