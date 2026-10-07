'use client';

import { CheckIcon, MinusIcon } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';

export type CheckboxProps = React.ComponentPropsWithRef<
  typeof CheckboxPrimitive.Root
>;

/**
 * Radix renders a `button` with `role="checkbox"`, so `checked` may also be
 * `'indeterminate'` — announced as "mixed" — for a parent whose children are partly chosen.
 */
export function Checkbox({ className, ...rest }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer group size-4 shrink-0 cursor-pointer rounded-inner border border-border-strong bg-surface-base text-fg-on-action disabled:cursor-not-allowed disabled:border-border-default disabled:bg-surface-subtle aria-invalid:border-status-error-border data-[state=checked]:border-action-primary data-[state=indeterminate]:border-action-primary data-[state=checked]:bg-action-primary data-[state=indeterminate]:bg-action-primary',
        className,
      )}
      {...rest}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center"
      >
        <CheckIcon className="size-3.5 group-data-[state=indeterminate]:hidden" />
        <MinusIcon className="hidden size-3.5 group-data-[state=indeterminate]:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
