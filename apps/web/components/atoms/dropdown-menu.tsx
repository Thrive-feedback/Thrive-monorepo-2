'use client';

import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';

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
          'z-50 min-w-48 overflow-hidden rounded-surface border border-border-default bg-surface-base p-1 text-fg-primary shadow-med',
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
        'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-element px-2 py-2 text-body-2 outline-hidden data-disabled:pointer-events-none data-highlighted:bg-action-primary-surface data-disabled:text-fg-secondary',
        className,
      )}
      {...rest}
    />
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
