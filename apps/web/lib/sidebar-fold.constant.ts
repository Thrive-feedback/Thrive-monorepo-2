import { MD_AND_UP, XL_AND_UP } from '@/lib/breakpoint.constant';

/** How wide the sidebar is: its full width, or the rail of its icons. */
export type SidebarWidth = 'wide' | 'rail';

/** Where a person's choice of width is kept, in their own browser. */
export const SIDEBAR_STORAGE_KEY = 'thrive.sidebar';

export type SidebarFoldInput = {
  /** What the person chose, or `null` while they have not. */
  saved: SidebarWidth | null;
  /** The window is at `md` or wider, where the sidebar stands beside the page. */
  atMd: boolean;
  /** The window is at `xl` or wider. */
  atXl: boolean;
};

/**
 * How the sidebar stands. From `xl` there is room for it at full width, so it is wide unless the
 * person folded it. On a tablet, between `md` and `xl`, the page needs the room, so it is the rail of
 * its icons whatever was chosen. On a phone it is not beside the page but in the menu drawer, which
 * has room for it at full width. Below `xl` the choice is locked, and the button that folds it is not
 * offered; it applies again from `xl`.
 */
export function sidebarFoldOf({ saved, atMd, atXl }: SidebarFoldInput): {
  width: SidebarWidth;
  locked: boolean;
} {
  if (atXl) {
    return { width: saved ?? 'wide', locked: false };
  }
  return { width: atMd ? 'rail' : 'wide', locked: true };
}

/** A saved width, or `null` for anything else a browser may hold under the key. */
export function savedSidebarWidth(value: string | null): SidebarWidth | null {
  return value === 'wide' || value === 'rail' ? value : null;
}

/**
 * Runs in `<head>` before the first paint and sets `data-sidebar` on `<html>` to `rail` or `wide`,
 * and `data-sidebar-locked` below `xl`, so the sidebar is drawn at its width at once rather than wide
 * and then folded. It stays listening for the window to cross `md` or `xl` and re-applies. The rule
 * is `sidebarFoldOf`'s, written again because a string inlined in the page cannot import; change
 * them together. It must stay small, synchronous and unable to throw.
 */
export const SIDEBAR_INIT_SCRIPT = `(function(){try{var t=matchMedia(${JSON.stringify(MD_AND_UP)}),m=matchMedia(${JSON.stringify(XL_AND_UP)}),k=${JSON.stringify(SIDEBAR_STORAGE_KEY)};function a(){var v=null;try{v=localStorage.getItem(k)}catch(e){}var d=document.documentElement,c=m.matches?(v==='wide'||v==='rail'?v:'wide'):t.matches?'rail':'wide';d.dataset.sidebar=c;if(m.matches){delete d.dataset.sidebarLocked}else{d.dataset.sidebarLocked=''}}a();t.addEventListener('change',a);m.addEventListener('change',a)}catch(e){}})()`;
