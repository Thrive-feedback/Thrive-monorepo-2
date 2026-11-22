/**
 * Measures Home and its loading state share, so the stand-in drawn while the page is built holds
 * exactly the room the page will take, and nothing jumps when it arrives.
 */

/** Room under the band's contents for the composer, which is pulled up over the band's foot. */
export const HOME_BAND_FOOT = 'pb-24';

/** How far the composer reaches up over the band's foot. */
export const HOME_COMPOSER_OVERLAP = 'relative z-10 -mt-16';

/** A day of the list from `md`: the date's margin beside the day's cards. */
export const HOME_DAY_ROW = 'md:flex md:gap-7';

/** The date's margin, 7rem wide from `md`. */
export const HOME_DAY_MARGIN = 'md:w-28 md:shrink-0';

/** The day's cards, taking the rest of the row. */
export const HOME_DAY_CARDS = 'min-w-0 md:flex-1';

/** How many days of the week a phone's ribbon has room for: the most recent ones. */
export const RIBBON_DAYS_ON_A_PHONE = 5;
