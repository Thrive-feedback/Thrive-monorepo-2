import { XL_AND_UP } from '@/lib/breakpoint.constant';
import { ROUTES } from '@/lib/routes.constant';

/** How wide the sidebar is: its full width, or the rail of its icons. */
export type SidebarWidth = 'wide' | 'rail';

/** Where a person's choice of width is kept, in their own browser. */
export const SIDEBAR_STORAGE_KEY = 'thrive.sidebar';

export type SidebarFoldInput = {
  /** What the person chose, or `null` while they have not. */
  saved: SidebarWidth | null;
  /** The window is at `xl` or wider. */
  atXl: boolean;
  /** The page is one of Settings'. */
  inSettings: boolean;
};

/**
 * How the sidebar stands. Below `xl` it is a rail unless the person widened it, and from `xl` it is
 * wide unless they folded it. Settings below `xl` needs the room for its own menu, so there it is a
 * rail whatever was chosen, and the choice is locked; it applies again outside Settings.
 */
export function sidebarFoldOf({ saved, atXl, inSettings }: SidebarFoldInput): {
  width: SidebarWidth;
  locked: boolean;
} {
  const locked = inSettings && !atXl;
  const chosen = saved ?? (atXl ? 'wide' : 'rail');
  return { width: locked ? 'rail' : chosen, locked };
}

/** A saved width, or `null` for anything else a browser may hold under the key. */
export function savedSidebarWidth(value: string | null): SidebarWidth | null {
  return value === 'wide' || value === 'rail' ? value : null;
}

/**
 * Runs in `<head>` before the first paint and sets `data-sidebar` on `<html>` to `rail` or `wide`,
 * and `data-sidebar-locked` while Settings forces the rail, so the sidebar is drawn at its width
 * at once rather than wide and then folded. It stays listening for the window to cross `xl` and
 * re-applies. The rule is `sidebarFoldOf`'s, and Settings' pages are `isSettingsPath`'s, written
 * again because a string inlined in the page cannot import; change them together. It must stay
 * small, synchronous and unable to throw.
 */
export const SIDEBAR_INIT_SCRIPT = `(function(){try{var m=matchMedia(${JSON.stringify(XL_AND_UP)}),k=${JSON.stringify(SIDEBAR_STORAGE_KEY)},s=${JSON.stringify(ROUTES.settings.index)};function a(){var v=null;try{v=localStorage.getItem(k)}catch(e){}var p=location.pathname,i=p===s||p.indexOf(s+'/')===0,l=i&&!m.matches,c=v==='wide'||v==='rail'?v:m.matches?'wide':'rail',d=document.documentElement;d.dataset.sidebar=l?'rail':c;if(l){d.dataset.sidebarLocked=''}else{delete d.dataset.sidebarLocked}}a();m.addEventListener('change',a)}catch(e){}})()`;
