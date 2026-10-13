'use client';

import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { Select as SelectPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';
import styles from './select.module.css';

/*
 * The parts are Radix's, so a select is written as a composition rather than configured with
 * an `options` array:
 *
 *   <Select value={v} onValueChange={setV}>
 *     <SelectTrigger aria-label="Team"><SelectValue placeholder="Pick a team" /></SelectTrigger>
 *     <SelectContent><SelectItem value="design">Design</SelectItem></SelectContent>
 *   </Select>
 *
 * The list always opens under the trigger, as wide as it — never over it or above it — so the
 * field stays in view while choosing. Near the bottom of the screen the list scrolls inside
 * itself rather than flipping up.
 */

export type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root>;

export function Select(props: SelectProps) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

export type SelectGroupProps = React.ComponentPropsWithRef<
  typeof SelectPrimitive.Group
>;

export function SelectGroup(props: SelectGroupProps) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

export type SelectValueProps = React.ComponentPropsWithRef<
  typeof SelectPrimitive.Value
>;

export function SelectValue(props: SelectValueProps) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

export type SelectTriggerProps = React.ComponentPropsWithRef<
  typeof SelectPrimitive.Trigger
>;

export function SelectTrigger({
  className,
  children,
  ...rest
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        'flex w-full cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-input border border-border-strong bg-surface-base px-3 py-2.5 text-body-1 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-fg-secondary aria-invalid:border-status-error-border data-placeholder:text-fg-disabled',
        className,
      )}
      {...rest}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 shrink-0 text-fg-secondary" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export type SelectContentProps = React.ComponentPropsWithRef<
  typeof SelectPrimitive.Content
>;

export function SelectContent({
  sideOffset = 4,
  className,
  children,
  ...rest
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position="popper"
        side="bottom"
        sideOffset={sideOffset}
        avoidCollisions={false}
        className={cn(
          'relative z-50 overflow-hidden rounded-control border border-border-muted bg-surface-base text-fg-primary shadow-med',
          styles.content,
          className,
        )}
        {...rest}
      >
        <SelectPrimitive.Viewport className="flex flex-col gap-0.5 p-1.5">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export type SelectLabelProps = React.ComponentPropsWithRef<
  typeof SelectPrimitive.Label
>;

export function SelectLabel({ className, ...rest }: SelectLabelProps) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('px-3 py-1.5 text-caption text-fg-secondary', className)}
      {...rest}
    />
  );
}

export type SelectItemProps = React.ComponentPropsWithRef<
  typeof SelectPrimitive.Item
>;

export function SelectItem({ className, children, ...rest }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-container py-2.5 pr-9 pl-3 text-body-2 outline-hidden data-disabled:pointer-events-none data-highlighted:bg-action-neutral-surface-hover data-[state=checked]:text-action-primary data-disabled:text-fg-disabled',
        className,
      )}
      {...rest}
    >
      <span className="absolute right-3 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-fg-accent" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
