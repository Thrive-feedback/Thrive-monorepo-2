'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Switch as SwitchPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';

const track = cva(
  'peer group inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 disabled:cursor-not-allowed disabled:bg-surface-subtle data-[state=checked]:bg-action-primary data-[state=unchecked]:bg-border-strong',
  {
    variants: {
      size: {
        sm: 'h-4 w-7',
        md: 'h-5 w-9',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const thumb = cva(
  'pointer-events-none block rounded-full bg-surface-base group-disabled:bg-border-default data-[state=unchecked]:translate-x-0',
  {
    variants: {
      size: {
        sm: 'size-3 data-[state=checked]:translate-x-3',
        md: 'size-4 data-[state=checked]:translate-x-4',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export type SwitchProps = React.ComponentPropsWithRef<
  typeof SwitchPrimitive.Root
> &
  VariantProps<typeof track>;

/**
 * An on/off setting that takes effect immediately. Announced as a switch that is on or off;
 * for a choice that is submitted with a form, use `Checkbox`.
 */
export function Switch({ size, className, ...rest }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(track({ size }), className)}
      {...rest}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={thumb({ size })}
      />
    </SwitchPrimitive.Root>
  );
}
