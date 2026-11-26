import { SIDEBAR_ID } from '@/app/(signed-in)/(sidebar)/_lib/sidebar-id.constant';
import { cn } from '@/lib/cn.util';
import styles from './sidebar-column.module.css';

export type SidebarColumnProps = {
  children: React.ReactNode;
};

/**
 * The column the sidebar stands in, against the frame's left edge and divided from the page by a
 * line, on a screen wide enough for it (`md`). It is full width or a rail of icons, as `data-sidebar`
 * on `<html>` says: a rail on a tablet, below `xl`, so the page has the room, until the person widens
 * it there, and from `xl` full width until the person folds it. The script before paint sets the
 * attribute on each load and as the window crosses a breakpoint. It eases between the two. The whole
 * column holds just below the navbar as the page scrolls, so nothing drawn on it moves.
 *
 * The + button at its top sits 12px in from the frame on both sides, so its corner runs parallel to
 * the frame's: the button's 9px and those 12px make the frame's 21px.
 */
export function SidebarColumn({ children }: SidebarColumnProps) {
  return (
    <aside
      id={SIDEBAR_ID}
      aria-label="Sidebar"
      className={cn(
        'hidden rail:w-16 w-56 shrink-0 border-border-subtle border-r px-3 pt-3 pb-6 md:block',
        styles.column,
      )}
    >
      {children}
    </aside>
  );
}
