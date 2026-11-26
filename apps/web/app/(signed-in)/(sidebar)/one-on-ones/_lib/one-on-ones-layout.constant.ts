/**
 * The 1:1s page runs the full width beside the sidebar, as the Kudos board does, so the list and the
 * open 1:1 sit side by side with room for both. The skeleton takes the same column, so nothing jumps.
 */
export const ONE_ON_ONES_COLUMN =
  'flex w-full flex-1 flex-col gap-6 px-4 py-5 md:px-6 xl:px-8';

/**
 * From `lg`, the list's column: a fixed 288px, scrolling on its own, with room for a focus ring. It
 * is positioned so what the list hides for screen readers only, which is placed absolutely, scrolls
 * with it rather than stretching the page.
 */
export const ONE_ON_ONES_LIST_COLUMN =
  'min-w-0 lg:relative lg:-m-1 lg:w-fit lg:shrink-0 lg:overflow-y-auto lg:p-1';

/**
 * From `lg`, the open 1:1's column takes the rest. A panel taller than the window scrolls inside it,
 * and the room around it keeps the invitation's shadow from being cut off.
 */
export const ONE_ON_ONES_PANEL_COLUMN =
  'min-w-0 lg:relative lg:-m-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:p-6';
