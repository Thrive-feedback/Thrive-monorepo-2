'use client';

import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn.util';
import styles from './dialog.module.css';

/*
 * The parts are Radix's, written as a composition:
 *
 *   <Dialog>
 *     <DialogTrigger asChild><Button>Invite</Button></DialogTrigger>
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>Invite a teammate</DialogTitle>
 *         <DialogDescription>They get an email with a link.</DialogDescription>
 *       </DialogHeader>
 *       …
 *       <DialogFooter>
 *         <DialogClose asChild><Button>Cancel</Button></DialogClose>
 *         <Button variant="primary">Send</Button>
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 *
 * Radix traps focus inside while it is open, closes it on Escape or a click on the scrim, and
 * gives focus back to the trigger. The title names the dialog, so every dialog needs one.
 */

export type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;

export function Dialog(props: DialogProps) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

export type DialogTriggerProps = React.ComponentPropsWithRef<
  typeof DialogPrimitive.Trigger
>;

export function DialogTrigger(props: DialogTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

export type DialogCloseProps = React.ComponentPropsWithRef<
  typeof DialogPrimitive.Close
>;

/** Wrap any control with `asChild` to make it close the dialog. */
export function DialogClose(props: DialogCloseProps) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

export type DialogContentProps = React.ComponentPropsWithRef<
  typeof DialogPrimitive.Content
> & {
  /** The × in the corner. Leave it on unless the footer already has a way out. */
  hasCloseButton?: boolean;
};

/** Centred on the page, at most the width of a short form, with the page dimmed behind it. */
export function DialogContent({
  hasCloseButton = true,
  className,
  children,
  ...rest
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className={cn(
          'fixed inset-0 z-50 bg-surface-scrim motion-safe:data-[state=closed]:animate-exit motion-safe:data-[state=open]:animate-enter',
          styles.scrim,
        )}
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed inset-x-4 top-1/2 z-50 mx-auto flex max-h-full max-w-128 -translate-y-1/2 flex-col gap-6 overflow-y-auto rounded-surface border border-border-muted bg-surface-raised p-6 text-fg-primary shadow-high motion-safe:data-[state=closed]:animate-exit motion-safe:data-[state=open]:animate-enter',
          className,
        )}
        {...rest}
      >
        {children}
        {hasCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            aria-label="Close"
            className="absolute top-4 right-4 cursor-pointer rounded-full p-1 text-fg-secondary transition-colors hover:bg-action-neutral-surface-hover hover:text-fg-primary"
          >
            <XIcon aria-hidden="true" className="size-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export type DialogHeaderProps = React.ComponentPropsWithRef<'div'>;

/** The title and its description, kept clear of the close button. */
export function DialogHeader({ className, ...rest }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 pe-8', className)}
      {...rest}
    />
  );
}

export type DialogFooterProps = React.ComponentPropsWithRef<'div'>;

/** The actions, stacked on a phone with the main one on top, in a row from `sm` up. */
export function DialogFooter({ className, ...rest }: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...rest}
    />
  );
}

export type DialogTitleProps = React.ComponentPropsWithRef<
  typeof DialogPrimitive.Title
>;

export function DialogTitle({ className, ...rest }: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-subtitle-2', className)}
      {...rest}
    />
  );
}

export type DialogDescriptionProps = React.ComponentPropsWithRef<
  typeof DialogPrimitive.Description
>;

export function DialogDescription({
  className,
  ...rest
}: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-body-2 text-fg-secondary', className)}
      {...rest}
    />
  );
}
