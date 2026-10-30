'use client';

import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer';
import { XIcon } from 'lucide-react';
import {
  createContext,
  isValidElement,
  type RefObject,
  useCallback,
  useContext,
  useRef,
} from 'react';
import { MD_AND_UP } from '@/lib/breakpoint.constant';
import { cn } from '@/lib/cn.util';
import { useMediaQuery } from '@/lib/use-media-query';
import styles from './drawer.module.css';

/*
 * shadcn's Base UI drawer (ADR 0066), rewritten to the tokens, as a composition:
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
 * A bottom sheet on a phone, swiped down to close, with a handle that says so; a panel on the
 * right from `md`, swiped right. Escape, the × or a press outside closes it too, and focus goes
 * back to the trigger. The title names it, so every drawer needs one.
 *
 * `modal={false}` leaves the page in reach while it is open: focus is not held, and the page is
 * not hidden from assistive technology. A press on the page still closes it, as the press goes
 * down, and reaches what was pressed, so one press both puts the drawer away and starts the next
 * thing.
 */

type DrawerSide = 'down' | 'right';

/** What `Drawer` tells its content: the edge it comes from, and how to close a non-modal one. */
type DrawerSetting = {
  side: DrawerSide;
  modal: DrawerPrimitive.Root.Props['modal'];
  actionsRef: RefObject<DrawerPrimitive.Root.Actions | null>;
};

const DrawerSettingContext = createContext<DrawerSetting | null>(null);

function useDrawerSetting() {
  const setting = useContext(DrawerSettingContext);
  if (!setting) {
    throw new Error('A drawer part must be inside a Drawer.');
  }
  return setting;
}

/**
 * Base UI's root, less what this drawer cannot draw: it comes from the bottom or the right, by the
 * window's width, and has no snap points.
 */
export type DrawerProps = Omit<
  DrawerPrimitive.Root.Props,
  | 'swipeDirection'
  | 'snapPoints'
  | 'snapPoint'
  | 'defaultSnapPoint'
  | 'onSnapPointChange'
  | 'actionsRef'
>;

export function Drawer({ modal = true, ...rest }: DrawerProps) {
  const side: DrawerSide = useMediaQuery(MD_AND_UP) ? 'right' : 'down';
  const actionsRef = useRef<DrawerPrimitive.Root.Actions | null>(null);

  return (
    <DrawerSettingContext value={{ side, modal, actionsRef }}>
      <DrawerPrimitive.Root
        swipeDirection={side}
        modal={modal}
        actionsRef={actionsRef}
        {...rest}
      />
    </DrawerSettingContext>
  );
}

export type DrawerTriggerProps = DrawerPrimitive.Trigger.Props & {
  /** Make the one child the trigger, as the Radix atoms' `asChild` does. */
  asChild?: boolean;
};

export function DrawerTrigger({
  asChild = false,
  children,
  ...rest
}: DrawerTriggerProps) {
  if (asChild && isValidElement<Record<string, unknown>>(children)) {
    return (
      <DrawerPrimitive.Trigger
        data-slot="drawer-trigger"
        render={children}
        {...rest}
      />
    );
  }
  return (
    <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...rest}>
      {children}
    </DrawerPrimitive.Trigger>
  );
}

export type DrawerCloseProps = DrawerPrimitive.Close.Props & {
  /** Make the one child close the drawer, as the Radix atoms' `asChild` does. */
  asChild?: boolean;
};

/** Wrap any control with `asChild` to make it close the drawer. */
export function DrawerClose({
  asChild = false,
  children,
  ...rest
}: DrawerCloseProps) {
  if (asChild && isValidElement<Record<string, unknown>>(children)) {
    return (
      <DrawerPrimitive.Close
        data-slot="drawer-close"
        render={children}
        {...rest}
      />
    );
  }
  return (
    <DrawerPrimitive.Close data-slot="drawer-close" {...rest}>
      {children}
    </DrawerPrimitive.Close>
  );
}

/** A part's own props, with a plain class list: these parts merge theirs with the caller's. */
type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

export type DrawerContentProps = WithClassName<DrawerPrimitive.Popup.Props> & {
  /**
   * Where it is rendered; the end of the page if not given. Opened from inside a Radix modal, it
   * must be that modal's content: Radix keeps focus inside its own DOM (ADR 0066).
   */
  container?: DrawerPrimitive.Portal.Props['container'];
};

/**
 * Up from the bottom edge on a phone, at most three quarters of its height; in from the right
 * edge from `md`, the window's full height. The page behind is neither dimmed nor blurred, so
 * what is chosen here can be seen taking effect there.
 */
export function DrawerContent({
  container,
  initialFocus = true,
  className,
  children,
  ...rest
}: DrawerContentProps) {
  const { side, modal, actionsRef } = useDrawerSetting();

  // Base UI closes a non-modal drawer when a mouse press outside is let go; this closes it as the
  // press goes down, so pressing a sticker to move it puts the drawer away and starts the move. Only
  // while it is open: the listener comes and goes with the popup. Left to Base UI: the trigger of
  // the open drawer, which opens and closes it, and a finger: Base UI closes on a tap, or once a
  // finger outside moves more than 10px (a scroll of the page counts), never the moment it lands.
  // "Outside" is the page's DOM, so anything
  // portalled out of a non-modal drawer (a menu, a tooltip) must be rendered into it instead.
  // Stable, so a re-render does not take the listener off and put it back.
  const closeOnPressOutside = useCallback(
    (popup: HTMLDivElement | null) => {
      if (!popup || modal !== false) {
        return;
      }
      function handlePointerDown(event: PointerEvent) {
        const target = event.target;
        if (
          event.pointerType !== 'touch' &&
          target instanceof Node &&
          !popup?.contains(target) &&
          !(target instanceof Element && target.closest('[data-popup-open]'))
        ) {
          actionsRef.current?.close();
        }
      }
      document.addEventListener('pointerdown', handlePointerDown, true);
      return () =>
        document.removeEventListener('pointerdown', handlePointerDown, true);
    },
    [modal, actionsRef],
  );

  return (
    <DrawerPrimitive.Portal container={container}>
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className="pointer-events-none fixed inset-0 z-50"
      >
        <DrawerPrimitive.Popup
          ref={closeOnPressOutside}
          data-slot="drawer-popup"
          // The first control in it, as every dialog here does; Base UI's drawer would hold the
          // panel itself, which leaves a keyboard a Tab away from anything to do.
          initialFocus={initialFocus}
          className={cn(
            'pointer-events-auto fixed flex flex-col border border-border-muted bg-surface-raised text-fg-primary shadow-high outline-hidden data-[swipe-direction=down]:inset-x-0 data-[swipe-direction=right]:inset-y-4 data-[swipe-direction=right]:right-4 data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:max-h-3/4 data-[swipe-direction=right]:w-96 data-[swipe-direction=right]:max-w-full data-[swipe-direction=right]:rounded-surface data-[swipe-direction=down]:rounded-t-surface',
            styles.popup,
            className,
          )}
          {...rest}
        >
          {side === 'down' && (
            <span
              data-slot="drawer-handle"
              aria-hidden="true"
              className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border-strong"
            />
          )}
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className="relative flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6"
          >
            {children}
            <DrawerPrimitive.Close
              data-slot="drawer-close"
              aria-label="Close"
              className="absolute top-4 right-4 cursor-pointer rounded-full p-1 text-fg-secondary transition-colors hover:bg-action-neutral-surface-hover hover:text-fg-primary"
            >
              <XIcon aria-hidden="true" className="size-5" />
            </DrawerPrimitive.Close>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
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

export type DrawerTitleProps = WithClassName<DrawerPrimitive.Title.Props>;

export function DrawerTitle({ className, ...rest }: DrawerTitleProps) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-subtitle-2', className)}
      {...rest}
    />
  );
}

export type DrawerDescriptionProps =
  WithClassName<DrawerPrimitive.Description.Props>;

export function DrawerDescription({
  className,
  ...rest
}: DrawerDescriptionProps) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-body-2 text-fg-secondary', className)}
      {...rest}
    />
  );
}
