'use client';

import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';
import styles from './drawer.module.css';

/*
 * The parts are Radix's dialog, written as a composition:
 *
 *   <Drawer>
 *     <DrawerTrigger asChild><Button>Templates</Button></DrawerTrigger>
 *     <DrawerContent>
 *       <DrawerHeader>
 *         <DrawerTitle>Templates</DrawerTitle>
 *         <DrawerDescription>Choose the picture on the front.</DrawerDescription>
 *       </DrawerHeader>
 *       …
 *     </DrawerContent>
 *   </Drawer>
 *
 * Radix traps focus inside while it is open, closes it on Escape or a press outside, and gives
 * focus back to the trigger. The title names the drawer, so every drawer needs one.
 *
 * `modal={false}` leaves the page in reach while it is open: focus is not held, and the page is
 * not hidden from assistive technology. A press on the page still closes it, and reaches what was
 * pressed, so one press both puts the drawer away and starts the next thing.
 */

export type DrawerProps = React.ComponentProps<typeof DialogPrimitive.Root>;

export function Drawer(props: DrawerProps) {
  return <DialogPrimitive.Root data-slot="drawer" {...props} />;
}

export type DrawerTriggerProps = React.ComponentPropsWithRef<
  typeof DialogPrimitive.Trigger
>;

export function DrawerTrigger(props: DrawerTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

export type DrawerCloseProps = React.ComponentPropsWithRef<
  typeof DialogPrimitive.Close
>;

/** Wrap any control with `asChild` to make it close the drawer. */
export function DrawerClose(props: DrawerCloseProps) {
  return <DialogPrimitive.Close data-slot="drawer-close" {...props} />;
}

export type DrawerContentProps = React.ComponentPropsWithRef<
  typeof DialogPrimitive.Content
>;

/**
 * Up from the bottom edge on a phone, at most three quarters of its height; in from the right
 * edge from `md`, the window's full height. The page behind is neither dimmed nor blurred, so
 * what is chosen here can be seen taking effect there.
 */
export function DrawerContent({
  className,
  children,
  ...rest
}: DrawerContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-3/4 flex-col gap-6 overflow-y-auto rounded-t-surface border border-border-muted bg-surface-raised p-6 text-fg-primary shadow-high md:inset-y-4 md:right-4 md:left-auto md:max-h-none md:w-96 md:rounded-surface',
          styles.content,
          className,
        )}
        {...rest}
      >
        {children}
        <DialogPrimitive.Close
          data-slot="drawer-close"
          aria-label="Close"
          className="absolute top-4 right-4 cursor-pointer rounded-full p-1 text-fg-secondary transition-colors hover:bg-action-neutral-surface-hover hover:text-fg-primary"
        >
          <XIcon aria-hidden="true" className="size-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export type DrawerHeaderProps = React.ComponentPropsWithRef<'div'>;

/** The title and its description, kept clear of the close button. */
export function DrawerHeader({ className, ...rest }: DrawerHeaderProps) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('flex flex-col gap-2 pe-8', className)}
      {...rest}
    />
  );
}

export type DrawerTitleProps = React.ComponentPropsWithRef<
  typeof DialogPrimitive.Title
>;

export function DrawerTitle({ className, ...rest }: DrawerTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-subtitle-2', className)}
      {...rest}
    />
  );
}

export type DrawerDescriptionProps = React.ComponentPropsWithRef<
  typeof DialogPrimitive.Description
>;

export function DrawerDescription({
  className,
  ...rest
}: DrawerDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-body-2 text-fg-secondary', className)}
      {...rest}
    />
  );
}
