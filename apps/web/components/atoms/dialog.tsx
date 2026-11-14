'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
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
 *
 * Below `md` it is a bottom sheet, swiped down by its handle to close; from `md` it is a card in
 * the middle of the page (ADR 0084).
 */

/** Closes the dialog the content is in, however its caller drives it. */
const DialogCloseContext = createContext<(() => void) | null>(null);

export type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;

/**
 * Radix's root, holding whether it is open itself when the caller does not, so that a swipe on the
 * sheet closes it through the same `onOpenChange` as every other way out.
 */
export function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...rest
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(isOpen);
      }
      onOpenChange?.(isOpen);
    },
    [isControlled, onOpenChange],
  );
  const close = useCallback(() => handleOpenChange(false), [handleOpenChange]);

  return (
    <DialogCloseContext value={close}>
      <DialogPrimitive.Root
        data-slot="dialog"
        open={open}
        onOpenChange={handleOpenChange}
        {...rest}
      />
    </DialogCloseContext>
  );
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

const dialogContent = cva(
  'fixed z-50 mx-auto flex flex-col gap-6 overflow-y-auto border border-border-muted bg-surface-raised p-6 text-fg-primary shadow-high',
  {
    variants: {
      placement: {
        // A sheet on the bottom edge of a phone, its padding clear of the handle; from `md`, the
        // card in the middle of the page. Its slide and drag on a phone are in the stylesheet; the
        // card drops the drag's transform, so it never becomes the containing block of something
        // fixed inside it, such as a Drawer.
        adaptive: [
          'inset-x-0 bottom-0 max-h-3/4 rounded-t-surface pt-10 md:inset-x-4 md:top-1/2 md:bottom-auto md:max-h-full md:max-w-128 md:-translate-y-1/2 md:transform-none md:rounded-surface md:pt-6 md:motion-safe:data-[state=closed]:animate-exit md:motion-safe:data-[state=open]:animate-enter',
          styles.sheet,
        ],
        // The card in the middle at every width, for a caller that lays it out over the whole
        // window itself.
        screen:
          'inset-x-4 top-1/2 max-h-full max-w-128 -translate-y-1/2 rounded-surface motion-safe:data-[state=closed]:animate-exit motion-safe:data-[state=open]:animate-enter',
      },
    },
    defaultVariants: { placement: 'adaptive' },
  },
);

/** Dragged down past this share of the sheet's height, the sheet closes when let go. */
const SWIPE_CLOSE_SHARE = 0.25;
/** Let go while moving down faster than this, in pixels a millisecond, the sheet closes however short the drag. */
const SWIPE_FLICK_SPEED = 0.5;
/** A flick is a release within this many milliseconds of the last move; a finger that paused first was not flicking. */
const SWIPE_FLICK_WINDOW = 100;

/**
 * The handle's drag. While a finger or the mouse holds it, the sheet follows it down, never up,
 * through `--sheet-drag`; let go past a quarter of the sheet's height or with a flick, the sheet
 * closes from where it is, and otherwise it settles back on the stylesheet's transition.
 */
function useSheetSwipe(close: () => void) {
  const drag = useRef<{
    start: number;
    distance: number;
    time: number;
    speed: number;
  } | null>(null);

  function sheetOf(handle: Element) {
    return handle.closest<HTMLElement>('[data-slot="dialog-content"]');
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      start: event.clientY,
      distance: 0,
      time: event.timeStamp,
      speed: 0,
    };
    sheetOf(event.currentTarget)?.setAttribute('data-swiping', '');
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current) {
      return;
    }
    const distance = Math.max(0, event.clientY - current.start);
    const elapsed = event.timeStamp - current.time;
    if (elapsed > 0) {
      current.speed = (distance - current.distance) / elapsed;
    }
    current.distance = distance;
    current.time = event.timeStamp;
    sheetOf(event.currentTarget)?.style.setProperty(
      '--sheet-drag',
      `${distance}px`,
    );
  }

  // `releasedAt` is when the finger let go, or `null` when the browser cancelled the drag.
  function settle(handle: Element, releasedAt: number | null) {
    const current = drag.current;
    drag.current = null;
    const sheet = sheetOf(handle);
    if (!current || !sheet) {
      return;
    }
    sheet.removeAttribute('data-swiping');
    const isFarEnough =
      current.distance > sheet.offsetHeight * SWIPE_CLOSE_SHARE;
    const isFlicked =
      releasedAt !== null &&
      releasedAt - current.time < SWIPE_FLICK_WINDOW &&
      current.distance > 0 &&
      current.speed > SWIPE_FLICK_SPEED;
    if (releasedAt !== null && (isFarEnough || isFlicked)) {
      close();
      return;
    }
    sheet.style.setProperty('--sheet-drag', '0px');
  }

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: (event: React.PointerEvent<HTMLElement>) =>
      settle(event.currentTarget, event.timeStamp),
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) =>
      settle(event.currentTarget, null),
  };
}

/** The sheet's grab handle: what a finger drags down to put the sheet away. */
function SheetHandle() {
  const close = useContext(DialogCloseContext);
  if (!close) {
    throw new Error('DialogContent must be inside a Dialog.');
  }
  const swipe = useSheetSwipe(close);

  return (
    <span
      data-slot="dialog-handle"
      aria-hidden="true"
      className="absolute inset-x-0 top-0 flex h-10 cursor-grab touch-none justify-center active:cursor-grabbing md:hidden"
      {...swipe}
    >
      <span className="mt-3 h-1.5 w-12 rounded-full bg-border-strong" />
    </span>
  );
}

export type DialogContentProps = React.ComponentPropsWithRef<
  typeof DialogPrimitive.Content
> &
  VariantProps<typeof dialogContent> & {
    /** The × in the corner. Leave it on unless the footer already has a way out. */
    hasCloseButton?: boolean;
    /** Added to the scrim behind it, for a dialog that shows the page differently. */
    overlayClassName?: string;
  };

/**
 * At most the width of a short form, with the page dimmed behind it: a sheet on a phone, centred
 * on the page from `md` (`adaptive`), or centred at every width for a caller that lays it out over
 * the whole window (`screen`).
 */
export function DialogContent({
  placement,
  hasCloseButton = true,
  overlayClassName,
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
          overlayClassName,
        )}
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(dialogContent({ placement }), className)}
        {...rest}
      >
        {placement !== 'screen' && <SheetHandle />}
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
