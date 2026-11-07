/**
 * How many Kudos one read brings. It has nothing to do with how many a page shows, which follows the
 * width of the window: the board holds what it has read and slices it (`useKudosBoardPages`).
 */
export const KUDOS_BOARD_READ_SIZE = 12;

/** The board is two rows high at every width, so it never asks for a scroll. */
export const KUDOS_BOARD_ROWS = 2;

/** The filter's choice of every month, since a choice cannot be empty. */
export const KUDOS_BOARD_ALL_MONTHS = 'all';

/** Where Tidy up sends focus back to. */
export const KUDOS_BOARD_HEADING_ID = 'kudos-board-heading';

/**
 * The board takes the whole of the frame under the title, rather than the column the other pages
 * sit in: it fits the window, and a card cannot be opened larger.
 */
export const KUDOS_BOARD_COLUMN =
  'flex w-full flex-1 flex-col gap-4 px-4 py-5 md:px-6 xl:px-8';

/**
 * How many cards stand across, which `useKudosBoardColumns` reads back from the page. The padding is
 * room for a leaning corner and a shadow, which the board would otherwise cut off.
 */
export const KUDOS_BOARD_GRID =
  'grid-cols-2 gap-x-4 p-2 md:grid-cols-3 md:gap-x-5 md:p-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-6';
