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
        'peer size-4 shrink-0 cursor-pointer rounded-full border border-border-strong bg-surface-base disabled:cursor-not-allowed disabled:border-border-default disabled:bg-surface-subtle aria-invalid:border-status-error-border data-[state=checked]:border-action-primary',
        className,
      )}
      {...rest}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center"
      >
        <span className="size-2 rounded-full bg-action-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}
