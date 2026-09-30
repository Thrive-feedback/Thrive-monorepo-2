'use client';

import { Label as LabelPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';

export type LabelProps = React.ComponentPropsWithRef<
  typeof LabelPrimitive.Root
>;

/** Dims with the control it names when that control is its `peer` and is disabled. */
export function Label({ className, ...rest }: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex select-none items-center gap-2 text-subtitle4 peer-disabled:cursor-not-allowed peer-disabled:text-foreground-muted',
        className,
      )}
      {...rest}
    />
  );
}
