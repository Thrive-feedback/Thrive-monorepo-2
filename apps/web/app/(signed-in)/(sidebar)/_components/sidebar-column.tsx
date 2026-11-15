'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { isSettingsPath } from '@/app/(signed-in)/(sidebar)/_lib/settings-path.util';
import { SIDEBAR_ID } from '@/app/(signed-in)/(sidebar)/_lib/sidebar-id.constant';
import { cn } from '@/lib/cn.util';
import { applySidebarFold } from '@/lib/use-sidebar-fold';
import styles from './sidebar-column.module.css';

export type SidebarColumnProps = {
  children: React.ReactNode;
};

/**
 * The column the sidebar stands in, against the frame's left edge and divided from the page by a
 * line, on a screen wide enough for it (`md`). It is full width or a rail of icons, as `data-sidebar`
 * on `<html>` says: a rail below `xl` and full width from it until the person chooses, and a rail in
 * Settings below `xl` whatever they chose, so Settings' own menu and the open section both fit
 * beside it. It eases between the two. Its contents stay in view as the page scrolls, stuck just
 * below the navbar.
 *
 * The script before paint sets the attribute on each load; a client navigation in or out of
 * Settings loads nothing, so the column sets it again here. It reads the path itself because the
 * layout around it does not run again when the client navigates between the pages under it.
 *
 * The + button at its top sits 12px in from the frame on both sides, so its corner runs parallel to
 * the frame's: the button's 9px and those 12px make the frame's 21px.
 */
export function SidebarColumn({ children }: SidebarColumnProps) {
  const pathname = usePathname();
  const inSettings = isSettingsPath(pathname);

  useEffect(() => {
    applySidebarFold(inSettings);
  }, [inSettings]);

  return (
    <aside
      id={SIDEBAR_ID}
      aria-label="Sidebar"
      className={cn(
        'hidden rail:w-16 w-56 shrink-0 border-border-subtle border-r px-3 pt-3 pb-6 md:block',
        styles.column,
      )}
    >
      <div className="sticky top-21">{children}</div>
    </aside>
  );
}
