import { createContext, type RefObject, useContext } from 'react';

/**
 * The postcard dialog's own content, where its drawers are rendered. The dialog is a Radix modal,
 * which keeps focus inside its own DOM; a drawer rendered at the end of the page would have focus
 * pulled out of it (ADR 0066). The editor provides it; the pickers read it.
 */
export const PostcardDrawerContainer = createContext<
  RefObject<HTMLElement | null> | undefined
>(undefined);

/**
 * Where a postcard drawer is rendered: inside the dialog, or, outside one, nothing given, which
 * is the end of the page. Not `null`: Base UI reads that as "wait for a container" and renders
 * nothing.
 */
export function usePostcardDrawerContainer() {
  return useContext(PostcardDrawerContainer);
}
