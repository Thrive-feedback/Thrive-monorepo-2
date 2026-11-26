/**
 * The composer's box, loading or not. It lies across the foot of Home's band, half on the band and
 * half on the page, so it is paper of its own on the page's ground, lifted as what floats is.
 */
export const FEED_COMPOSER_SURFACE =
  'flex flex-col gap-4 rounded-page border border-border-muted bg-surface-base px-6.25 py-5 shadow-med';

/**
 * The row its choices sit in, one above the other on a phone. Side by side they share the width
 * evenly, but none narrower than its name, so in a narrower composer, as beside Home's small week,
 * the longest name keeps its width and the others give way, rather than a name spilling out of its
 * button.
 */
export const FEED_COMPOSER_CHOICES = 'grid grid-cols-1 gap-2 sm:flex';

/** One choice in that row, or its stand-in. */
export const FEED_COMPOSER_CHOICE = 'sm:flex-1';
