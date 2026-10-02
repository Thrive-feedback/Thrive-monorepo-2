'use client';

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';

export type RadioGroupProps = React.ComponentPropsWithRef<
  typeof RadioGroupPrimitive.Root
>;

/**
 * One tab stop for the whole group; the arrow keys move between items and choose as they go,
 * which is how a native radio group behaves. Name the group with `aria-label` or
 * `aria-labelledby`.
 */
export function RadioGroup({ className, ...rest }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...rest}
    />
  );
}

export type RadioGroupItemProps = React.ComponentPropsWithRef<
  typeof RadioGroupPrimitive.Item
>;

export function RadioGroupItem({ className, ...rest }: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'peer size-4 shrink-0 cursor-pointer rounded-full border border-line-strong bg-surface disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken aria-invalid:border-danger data-[state=checked]:border-action',
        className,
      )}
      {...rest}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center"
      >
        <span className="size-2 rounded-full bg-action" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}
