'use client';

import { CheckIcon } from 'lucide-react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';
import styles from './dropdown-menu.module.css';

/*
 * The parts are Radix's, written as a composition:
 *
 *   <DropdownMenu>
 *     <DropdownMenuTrigger aria-label="Account">…</DropdownMenuTrigger>
 *     <DropdownMenuContent>
 *       <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 *
 * An item that navigates wraps a `Link` with `asChild`, so it stays a link to a screen reader
 * and opens in a new tab on a middle click.
 */

export type DropdownMenuProps = React.ComponentProps<
  typeof DropdownMenuPrimitive.Root
>;

export function DropdownMenu(props: DropdownMenuProps) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

export type DropdownMenuTriggerProps = React.ComponentPropsWithRef<
  typeof DropdownMenuPrimitive.Trigger
>;

export function DropdownMenuTrigger({
  className,
  ...rest
}: DropdownMenuTriggerProps) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn('cursor-pointer rounded-full', className)}
      {...rest}
    />
  );
}

export type DropdownMenuContentProps = React.ComponentPropsWithRef<
  typeof DropdownMenuPrimitive.Content
>;

/** Opens below the trigger, aligned to its end edge, because a menu like this sits at the right. */
export function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 8,
  ...rest
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-48 overflow-hidden rounded-control border border-border-muted bg-surface-raised p-1 text-fg-primary shadow-med motion-safe:data-[state=closed]:animate-menu-exit motion-safe:data-[state=open]:animate-menu-enter',
          styles.content,
          className,
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export type DropdownMenuLabelProps = React.ComponentPropsWithRef<
  typeof DropdownMenuPrimitive.Label
>;

export function DropdownMenuLabel({
  className,
  ...rest
}: DropdownMenuLabelProps) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn('px-2 py-1.5 text-caption text-fg-secondary', className)}
      {...rest}
    />
  );
}

export type DropdownMenuItemProps = React.ComponentPropsWithRef<
  typeof DropdownMenuPrimitive.Item
>;

export function DropdownMenuItem({
  className,
  ...rest
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-element px-2 py-2 text-body-2 outline-hidden transition-colors data-disabled:pointer-events-none data-highlighted:bg-action-primary-surface data-disabled:text-fg-secondary',
        className,
      )}
      {...rest}
    />
  );
}

/** The look shared by the items that are on or off: checkbox and radio. */
const SELECTABLE_ITEM =
  'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-element py-2 pr-9 pl-2 text-body-2 outline-hidden transition-colors data-disabled:pointer-events-none data-highlighted:bg-action-primary-surface data-[state=checked]:text-action-primary data-disabled:text-fg-secondary';

/** The tick at the end of an item that is on. */
function SelectedTick() {
  return (
    <span className="absolute right-2 flex size-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon className="size-4 text-fg-accent" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
  );
}

export type DropdownMenuCheckboxItemProps = React.ComponentPropsWithRef<
  typeof DropdownMenuPrimitive.CheckboxItem
>;

/**
 * An item that is on or off, for a menu that picks several things. It keeps the menu open when
 * chosen unless the caller says otherwise, because picking one of several is rarely the last pick.
 */
export function DropdownMenuCheckboxItem({
  className,
  children,
  onSelect,
  ...rest
}: DropdownMenuCheckboxItemProps) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(SELECTABLE_ITEM, className)}
      onSelect={(event) => {
        event.preventDefault();
        onSelect?.(event);
      }}
      {...rest}
    >
      <SelectedTick />
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export type DropdownMenuRadioGroupProps = React.ComponentPropsWithRef<
  typeof DropdownMenuPrimitive.RadioGroup
>;

/** The items that pick one thing: a screen reader hears them as choices, one of which is on. */
export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

export type DropdownMenuRadioItemProps = React.ComponentPropsWithRef<
  typeof DropdownMenuPrimitive.RadioItem
>;

/** One of the choices in a `DropdownMenuRadioGroup`, ticked when it is the one chosen. */
export function DropdownMenuRadioItem({
  className,
  children,
  ...rest
}: DropdownMenuRadioItemProps) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(SELECTABLE_ITEM, className)}
      {...rest}
    >
      <SelectedTick />
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

export type DropdownMenuSeparatorProps = React.ComponentPropsWithRef<
  typeof DropdownMenuPrimitive.Separator
>;

export function DropdownMenuSeparator({
  className,
  ...rest
}: DropdownMenuSeparatorProps) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 my-1 h-px bg-border-subtle', className)}
      {...rest}
    />
  );
}
