/**
 * The two colour modes the token layer defines. `light` is the default and the one the server
 * renders; `dark` is the semantic layer's `:root[data-theme='dark']` mode (ADR 0028).
 */
export type Theme = 'light' | 'dark';

/** Where a person's choice of mode is kept, in their own browser. */
export const THEME_STORAGE_KEY = 'thrive.theme';

/**
 * Runs in `<head>` before the first paint and applies a saved dark choice, so a page someone
 * left dark does not paint light and then flip. It is a string because the root layout inlines
 * it; it must stay small, synchronous and unable to throw.
 */
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==='dark')document.documentElement.dataset.theme='dark'}catch(e){}})()`;
