'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';

/*
 * The parts are Radix's, written as a composition:
 *
 *   <Tooltip>
 *     <TooltipTrigger asChild>
 *       <Button size="icon" aria-label="Copy link"><CopyIcon aria-hidden="true" /></Button>
 *     </TooltipTrigger>
 *     <TooltipContent>Copy link</TooltipContent>
 *   </Tooltip>
 *
 * It opens on hover and on keyboard focus, and closes on Escape. The trigger is described by
 * the content, so a tooltip only ever repeats or adds to a name — it never is the only name a
 * control has, because touch screens never show it.
 */

export type TooltipProps = React.ComponentProps<typeof TooltipPrimitive.Root>;

/** Carries its own provider, so a page needs no wrapper to use one. */
export function Tooltip({ delayDuration = 300, ...rest }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root data-slot="tooltip" {...rest} />
    </TooltipPrimitive.Provider>
  );
}

export type TooltipTriggerProps = React.ComponentPropsWithRef<
  typeof TooltipPrimitive.Trigger
>;

export function TooltipTrigger(props: TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

export type TooltipContentProps = React.ComponentPropsWithRef<
  typeof TooltipPrimitive.Content
>;

/** Short text only: a few words, no links or buttons, since it vanishes when the pointer leaves. */
export function TooltipContent({
  sideOffset = 4,
  className,
  children,
  ...rest
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-fit max-w-64 text-balance rounded-container bg-action-neutral px-3 py-1.5 text-body-3 text-fg-on-neutral motion-safe:data-[state=closed]:animate-tooltip-exit motion-safe:data-[state=delayed-open]:animate-tooltip-enter motion-safe:data-[state=instant-open]:animate-tooltip-enter',
          className,
        )}
        {...rest}
      >
        {children}
        <TooltipPrimitive.Arrow className="h-1.5 w-3 fill-action-neutral" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
