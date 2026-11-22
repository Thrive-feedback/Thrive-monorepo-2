'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/atoms/drawer';
import { MenuButton } from '@/components/molecules/menu-button';
import { MD_AND_UP } from '@/lib/breakpoint.constant';
import { useMediaQuery } from '@/lib/use-media-query';

const MENU = 'Menu';

/** Puts the drawer away, for what is inside it. */
const CloseSidebarDrawer = createContext<() => void>(() => {});

export type SidebarDrawerProps = {
  /** The whole frame, so the button in the navbar and the drawer in the sidebar share one drawer. */
  children: React.ReactNode;
};

/**
 * The phone's way around: the sidebar, which has no room beside the page there, opened from the
 * navbar as a drawer along the left edge. Pressing a link in it puts it away, the page it is already
 * on included; it is also open only for the page it was opened on, so a navigation from anywhere
 * else closes it too. It is only ever open below `md`, where the sidebar itself is not shown, and
 * reaching `md` puts it away for good rather than hiding it until the window narrows again. It reads
 * the path itself because the layout around it does not run again when the client navigates between
 * the pages under it.
 */
export function SidebarDrawer({ children }: SidebarDrawerProps) {
  const pathname = usePathname();
  const atMd = useMediaQuery(MD_AND_UP);
  const [openOn, setOpenOn] = useState<string | null>(null);

  if (atMd && openOn !== null) {
    setOpenOn(null);
  }

  return (
    <CloseSidebarDrawer value={() => setOpenOn(null)}>
      <Drawer
        side="left"
        open={openOn === pathname && !atMd}
        onOpenChange={(isOpen) => setOpenOn(isOpen ? pathname : null)}
      >
        {children}
      </Drawer>
    </CloseSidebarDrawer>
  );
}

/** The button in the navbar that opens it, on a phone only. */
export function SidebarDrawerTrigger() {
  return (
    <DrawerTrigger asChild>
      <MenuButton label="Open menu" className="md:hidden" />
    </DrawerTrigger>
  );
}

export type SidebarDrawerContentProps = {
  /** What the sidebar holds: where to go, then, at the foot, Settings and who is signed in. */
  children: React.ReactNode;
};

/** The drawer itself, named Menu, holding the sidebar's places and its foot at full width. */
export function SidebarDrawerContent({ children }: SidebarDrawerContentProps) {
  const close = useContext(CloseSidebarDrawer);

  return (
    <DrawerContent
      onClick={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest('a[href]')
        ) {
          close();
        }
      }}
    >
      <DrawerHeader>
        <DrawerTitle>{MENU}</DrawerTitle>
      </DrawerHeader>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
    </DrawerContent>
  );
}
