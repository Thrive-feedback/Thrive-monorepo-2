/**
 * How wide the column of a page beside the sidebar is, and where it sits: 70% of the frame once that
 * is wider than 720px. On its own for a band that runs the page's width and keeps its content to the
 * column, such as a Profile's header.
 */
export const PAGE_COLUMN_WIDTH =
  'mx-auto w-full max-w-180 px-4 xl:w-7/10 xl:max-w-none xl:px-0';

/** The column a page beside the sidebar sits in, with the room above and below it. */
export const PAGE_COLUMN = `${PAGE_COLUMN_WIDTH} py-8`;
