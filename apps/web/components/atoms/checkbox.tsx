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
        'peer group size-4 shrink-0 rounded-indicator border border-line-strong bg-surface text-foreground-on-action disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken aria-invalid:border-danger data-[state=checked]:border-action data-[state=indeterminate]:border-action data-[state=checked]:bg-action data-[state=indeterminate]:bg-action',
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
