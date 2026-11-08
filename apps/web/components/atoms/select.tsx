'use client';

import { cva, type VariantProps } from 'class-variance-authority';
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

const trigger = cva(
  'flex cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-input border bg-surface-base transition-colors disabled:cursor-not-allowed disabled:bg-action-disabled-surface disabled:text-fg-secondary aria-invalid:border-status-error-border data-placeholder:text-fg-disabled',
  {
    variants: {
      variant: {
        /** A field of a form, as wide as its column. */
        field: 'w-full border-border-strong px-3 py-2.5 text-body-1',
        /** A quiet choice beside a heading, as wide as what it says. */
        inline:
          'min-h-10 w-fit border-border-muted px-3 py-2 text-body-2 hover:bg-action-neutral-surface-hover',
      },
    },
    defaultVariants: { variant: 'field' },
  },
);

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
> &
  VariantProps<typeof trigger>;

export function SelectTrigger({
  variant,
  className,
  children,
  ...rest
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(trigger({ variant }), className)}
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
> & {
  /** Grows past a narrow trigger, as an `inline` one is, so no item is cut short. */
  fitsItems?: boolean;
};

export function SelectContent({
  sideOffset = 4,
  fitsItems = false,
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
          'relative z-50 overflow-hidden rounded-control border border-border-muted bg-surface-base text-fg-primary shadow-med motion-safe:data-[state=closed]:animate-menu-exit motion-safe:data-[state=open]:animate-menu-enter',
          styles.content,
          fitsItems && styles.fitsItems,
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
        'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-container py-2.5 pr-9 pl-3 text-body-2 outline-hidden transition-colors data-disabled:pointer-events-none data-highlighted:bg-action-neutral-surface-hover data-[state=checked]:text-action-primary data-disabled:text-fg-disabled',
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
