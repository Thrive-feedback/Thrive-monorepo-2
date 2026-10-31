/** Where the postmark lands on every card, stamped or not: across the stamp's lower left, in %. */
const POSTMARK_SPOT = { x: 85.5, y: 19.9 } as const;

/** How far the postmark sits turned once it has landed, in degrees. */
export const POSTMARK_ANGLE = -8;

/**
 * The ring sits three quarters across the drawing, with the waves to its left: that point is what
 * lands on the spot, and what it turns about.
 */
export const POSTMARK_PLACE = {
  left: `${POSTMARK_SPOT.x}%`,
  top: `${POSTMARK_SPOT.y}%`,
  transformOrigin: '75% 50%',
};

export const POSTMARK_PLACE_CLASS_NAME =
  'pointer-events-none absolute z-30 -translate-x-3/4 -translate-y-1/2';
