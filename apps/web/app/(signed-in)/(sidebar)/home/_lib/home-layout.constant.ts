/**
 * Measures Home and its loading state share, so the stand-in drawn while the page is built holds
 * exactly the room the page will take, and nothing jumps when it arrives.
 */

/**
 * Home's heading, which stands where the band's contents begin, 24 down: the navbar's 18 and a gap
 * of 6. It stands before the band rather than in it, over the band, and takes no room of its own,
 * since the band keeps its room (`HOME_HEADING_ROOM`). Its box is the strip it settles into: it
 * stays there as the page scrolls, the week passing under it, so the page is always headed:
 * the navbar's 18, then its 16, which are that gap of 6, the settled heading's 8 and 2 clear of the
 * composer stuck under it. At the top of the page the heading is bigger than the strip and runs on
 * below it, into the room the band keeps.
 */
export const HOME_HEAD = 'sticky top-18 z-25 -mb-16 h-16 pt-6';

/**
 * The heading's line in that strip, 8 high, which a page title's line fits; the heading hangs from
 * its top, so it grows downward from where it stands and shrinks back up to it.
 */
export const HOME_HEADING_LINE = 'flex h-8 items-start';

/** The room the band keeps above the week for the heading at the top of the page: its display line. */
export const HOME_HEADING_ROOM = 'h-lh text-display-1';

/**
 * A line the width of the page that leaves the window once the page has scrolled 6, halfway through
 * the 12 over which the heading settles: where it settles at once for a browser with no scroll
 * timeline, or a reader who would rather nothing moved. It stands where the page begins, under the
 * navbar's 18, and 12 higher. Seen by nobody and taking no room.
 */
export const HOME_SETTLE_MARK =
  'pointer-events-none relative -top-12 h-px -mb-px';

/** Room under the band's contents for the composer, which is pulled up over the band's foot. */
export const HOME_BAND_FOOT = 'pb-24';

/** How far the composer reaches up over the band's foot. */
export const HOME_COMPOSER_OVERLAP = 'relative z-10 -mt-16';

/**
 * From `md`, the composer stays in view as the page scrolls, under the heading's 34, and 2 clear of
 * it, at 36, so something can be written from anywhere in the feed. Over the feed's cards and their
 * dates, under the heading, the navbar and the frame. A phone leaves it in the page: there its
 * choices stand one above the other and would take a third of the screen, and the navbar's "+"
 * writes from anywhere instead. The week stays under the heading there (`HOME_WEEK_STRIP`).
 */
export const HOME_COMPOSER_STUCK = 'md:sticky md:top-36 md:z-20';

/**
 * The composer and, once it is stuck, the week in small beside it, the composer taking what the week
 * leaves. At rest the week's room is shut, and the composer has the column's width. The gap between
 * them is the week's own, so it opens with the room.
 */
export const HOME_COMPOSER_ROW = 'flex';

/**
 * From `md`, the band's foot stays behind the stuck composer, so the composer lies across the band's
 * bites as it does at the top of the page. It reaches from the window's top to where those bites are,
 * the composer's top, 36, and as far again as the composer reaches over the band, 16: so it sticks
 * as the composer does, with its bites where the band's were. Taken back up out of the page's flow.
 */
export const HOME_STUCK_FOOT =
  'hidden -mt-52 h-52 md:sticky md:top-0 md:z-15 md:block';

/**
 * A strip the width of the page, 16 tall, whose foot leaves the window's top exactly as the composer
 * sticks, which is how Home knows it has: its foot stands where the band's foot ends, and from `md`
 * 52 higher, the composer's stuck top, 36, and its reach over the band, 16, as the stuck foot does.
 * The 16 it takes to leave is the scroll over which the small week comes in beside the composer, and
 * how far back the page must scroll before it goes again. On a phone, where nothing sticks, it leaves
 * as the band does. Seen by nobody and taking no room.
 */
export const HOME_STUCK_MARK =
  'pointer-events-none -mt-16 h-16 md:relative md:-top-52';

/**
 * On a phone, where the composer scrolls away, the small week stays under the heading instead, at
 * 36, 2 clear of the heading's strip, as the stuck composer is from `md`. It stands at the composer's
 * foot, the page's full width, and takes no room; the week hangs below it, over the list, the band's
 * foot behind it. From `md` the week is beside the composer.
 */
export const HOME_WEEK_STRIP = 'sticky top-36 z-20 h-0 md:hidden';

/**
 * A strip 16 tall whose foot leaves the window's top as the composer's foot passes under the band's
 * bites behind the week, 46 down, which is how the week knows to show: it comes in there and rises
 * the last 10 to where it sticks. The 16 it takes to come back is how far the page must scroll back
 * before the week goes again. Seen by nobody and taking no room. Only on a phone.
 */
export const HOME_WEEK_STRIP_MARK =
  'pointer-events-none relative -top-46 -mt-16 h-16 md:hidden';

/**
 * The band's foot behind the week on a phone, from the window's top down to the bites, 46, halfway
 * down the week, so the week lies across the bites as the stuck composer does from `md`, and nothing
 * of the list shows around it. It hangs from the week's strip, 36 above it.
 */
export const HOME_WEEK_STRIP_FOOT = 'absolute inset-x-0 -top-36 h-46';

/**
 * The page's ground under the band's foot on a phone, from just above its bites, 44, to where the
 * day's date row tucks under the week, 57, so the list shows neither through the bites nor at the
 * week's lower corners. It hangs from the week's strip.
 */
export const HOME_WEEK_STRIP_GROUND =
  'pointer-events-none absolute inset-x-0 top-8 h-13 bg-surface-base';

/**
 * From `md`, the band lies over its stuck foot, which waits under it until the band scrolls away, and
 * under the composer, which comes after it at the same layer.
 */
export const HOME_BAND_LAYER = 'md:z-20';

/**
 * Where a day's date stays in view. On a phone, just under the week's foot, which it tucks under
 * rather than leave a gap: the week's top, 36, its padding, 4, a day's column, its initial, date and
 * dots, 16.75, and its edge, so at 57. From `md`, 6 under the stuck composer's foot, which is its
 * top, 36, and its height, 36: its padding, the field and the choices, so at 78.
 */
export const HOME_DAY_MARGIN_STUCK = 'sticky top-57 md:top-78';

/**
 * Where a day comes to rest when a ribbon brings it into view: on a phone under the week stuck under
 * the heading, and from `md` under the stuck composer's foot.
 */
export const HOME_DAY_SCROLL_MARGIN = 'scroll-mt-57 md:scroll-mt-72';

/** A day of the list from `md`: the date's margin beside the day's cards. */
export const HOME_DAY_ROW = 'md:flex md:gap-7';

/** The date's margin, 7rem wide from `md`. */
export const HOME_DAY_MARGIN = 'md:w-28 md:shrink-0';

/** The day's cards, taking the rest of the row. */
export const HOME_DAY_CARDS = 'min-w-0 md:flex-1';

/** How many days of the week a phone's ribbon has room for: the most recent ones. */
export const RIBBON_DAYS_ON_A_PHONE = 5;

/** The line that says the composer has stuck, by its id, for what shows only once it has. */
export const HOME_STUCK_MARK_ID = 'home-composer-stuck';

/** The line that says the heading has settled, by its id. */
export const HOME_SETTLE_MARK_ID = 'home-heading-settled';

/** The line that says the week's strip has stuck under the heading on a phone, by its id. */
export const HOME_WEEK_STRIP_MARK_ID = 'home-week-strip-stuck';
