'use client';

import { usePathname } from 'next/navigation';
import { isSettingsPath } from '@/app/(signed-in)/(sidebar)/_lib/settings-path.util';
import { cn } from '@/lib/cn.util';
import styles from './sidebar-column.module.css';

export type SidebarColumnProps = {
  children: React.ReactNode;
};

/**
 * The column the sidebar stands in, against the frame's left edge and divided from the page by a
 * line, on a screen wide enough for it (`md`). In Settings, below `xl`, it narrows to a rail of
 * icons, so Settings' own menu and the open section both fit beside it; it eases between the two
 * as the person goes in and out of Settings. Its contents stay in view as the page scrolls, stuck
 * just below the navbar.
 *
 * The + button at its top sits 12px in from the frame on both sides, so its corner runs parallel to
 * the frame's: the button's 9px and those 12px make the frame's 21px. It reads the path itself
 * because the layout around it does not run again when the client navigates between the pages
 * under it.
 */
export function SidebarColumn({ children }: SidebarColumnProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        'hidden w-56 shrink-0 border-border-subtle border-r px-3 pt-3 pb-6 md:block',
        isSettingsPath(pathname) && 'max-xl:w-16',
        styles.column,
      )}
    >
      <div className="sticky top-21">{children}</div>
    </aside>
  );
}
