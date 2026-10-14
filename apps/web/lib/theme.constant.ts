/**
 * The two colour modes the token layer defines. `light` is the one the server renders; `dark` is
 * the semantic layer's `:root[data-theme='dark']` mode (ADR 0028). This is what `<html
 * data-theme>` holds — the mode in effect, never the person's choice.
 */
export type Theme = 'light' | 'dark';

/**
 * What a person chose: one of the modes, or `system` to follow their operating system. `system`
 * is also what anyone who has not chosen gets.
 */
export type ThemePreference = Theme | 'system';

/** Where a person's choice of mode is kept, in their own browser. */
export const THEME_STORAGE_KEY = 'thrive.theme';

/** Matches while the operating system asks for dark. */
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/**
 * Runs in `<head>` before the first paint and applies the saved choice, or the operating
 * system's on `system`, so a page does not paint light and then flip. It stays listening for the
 * operating system to change and re-applies, which is what makes `system` follow it live on every
 * page, not only where a theme control is mounted. It is a string because the root layout inlines
 * it; it must stay small, synchronous and unable to throw.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=matchMedia(${JSON.stringify(DARK_SCHEME_QUERY)});function a(){var p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});document.documentElement.dataset.theme=p==='dark'||(p!=='light'&&m.matches)?'dark':'light'}a();m.addEventListener('change',a)}catch(e){}})()`;
