/**
 * How many lines one read of the bell brings. The bell draws them all and asks for the next page
 * as the person scrolls near the end; the navigation counts the unread among the lines read so
 * far. It is the most the API gives in one page, so a long history takes the fewest round trips.
 */
export const NOTIFICATIONS_PAGE_SIZE = 100;
