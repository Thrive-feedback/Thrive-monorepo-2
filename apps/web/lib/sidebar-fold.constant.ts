import { MD_AND_UP, XL_AND_UP } from '@/lib/breakpoint.constant';

/** How wide the sidebar is: its full width, or the rail of its icons. */
export type SidebarWidth = 'wide' | 'rail';

/** Where a person's choice of width is kept, in their own browser, from `xl`. */
export const SIDEBAR_STORAGE_KEY = 'thrive.sidebar';

/**
 * Where their choice on a tablet is kept, apart from the desktop's: a tablet has less room, so
 * widening the sidebar there is its own choice, and one made on a desktop does not squeeze a tablet.
 */
export const SIDEBAR_TABLET_STORAGE_KEY = 'thrive.sidebar.tablet';

export type SidebarFoldInput = {
  /** What the person chose from `xl`, or `null` while they have not. */
  saved: SidebarWidth | null;
  /** What the person chose on a tablet, or `null` while they have not. */
  savedOnTablet: SidebarWidth | null;
  /** The window is at `md` or wider, where the sidebar stands beside the page. */
  atMd: boolean;
  /** The window is at `xl` or wider. */
  atXl: boolean;
};

/**
 * How the sidebar stands. From `xl` there is room for it at full width, so it is wide unless the
 * person folded it. On a tablet, between `md` and `xl`, the page needs the room, so it is the rail of
 * its icons until the person widens it there. On a phone it is not beside the page but in the menu
 * drawer, which has room for it at full width; there the width is locked, and the button that folds
 * it is not offered.
 */
export function sidebarFoldOf({
  saved,
  savedOnTablet,
  atMd,
  atXl,
}: SidebarFoldInput): {
  width: SidebarWidth;
  locked: boolean;
} {
  if (atXl) {
    return { width: saved ?? 'wide', locked: false };
  }
  if (atMd) {
    return { width: savedOnTablet ?? 'rail', locked: false };
  }
  return { width: 'wide', locked: true };
}

/** Where the choice for a window this wide is kept, or `null` on a phone, where none is made. */
export function sidebarStorageKeyOf({
  atMd,
  atXl,
}: Pick<SidebarFoldInput, 'atMd' | 'atXl'>): string | null {
  if (atXl) {
    return SIDEBAR_STORAGE_KEY;
  }
  return atMd ? SIDEBAR_TABLET_STORAGE_KEY : null;
}

/** A saved width, or `null` for anything else a browser may hold under the key. */
export function savedSidebarWidth(value: string | null): SidebarWidth | null {
  return value === 'wide' || value === 'rail' ? value : null;
}

/**
 * Runs in `<head>` before the first paint and sets `data-sidebar` on `<html>` to `rail` or `wide`,
 * and `data-sidebar-locked` on a phone, so the sidebar is drawn at its width at once rather than wide
 * and then folded. It stays listening for the window to cross `md` or `xl` and re-applies. The rule
 * is `sidebarFoldOf`'s, written again because a string inlined in the page cannot import; change
 * them together. It must stay small, synchronous and unable to throw.
 */
export const SIDEBAR_INIT_SCRIPT = `(function(){try{var t=matchMedia(${JSON.stringify(MD_AND_UP)}),m=matchMedia(${JSON.stringify(XL_AND_UP)}),K=${JSON.stringify(SIDEBAR_STORAGE_KEY)},T=${JSON.stringify(SIDEBAR_TABLET_STORAGE_KEY)};function a(){var d=document.documentElement,w=m.matches,n=t.matches,v=null;try{v=w?localStorage.getItem(K):n?localStorage.getItem(T):null}catch(e){}var c=v==='wide'||v==='rail'?v:w?'wide':n?'rail':'wide';var s=w||n;d.dataset.sidebar=s?c:'wide';if(s){delete d.dataset.sidebarLocked}else{d.dataset.sidebarLocked=''}}a();t.addEventListener('change',a);m.addEventListener('change',a)}catch(e){}})()`;
