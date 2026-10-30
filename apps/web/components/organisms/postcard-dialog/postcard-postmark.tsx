import { motion } from 'motion/react';
import styles from './postcard.module.css';
import { POSTMARK_CORNER } from './postcard-flight.util';

/**
 * The postmark: a ring saying who posted it, trailing cancelling waves, in ink. It
 * waits above the card, larger and turned, until the send brings it down, always on the card's
 * top-right corner. Decoration only.
 */
export function PostcardPostmark() {
  return (
    <motion.svg
      data-postmark
      aria-hidden="true"
      viewBox="0 0 112 64"
      initial={{ opacity: 0, scale: 1.6, rotate: -20 }}
      // The ring sits three quarters across the drawing, with the waves to its left: that point
      // is what lands on the corner, and what it turns about.
      style={{
        left: `${POSTMARK_CORNER.x}%`,
        top: `${POSTMARK_CORNER.y}%`,
        transformOrigin: '75% 50%',
      }}
      className="pointer-events-none absolute z-30 w-48 -translate-x-3/4 -translate-y-1/2 text-status-info"
    >
      <g className={styles.postmarkInk}>
        <circle cx="84" cy="32" r="26" />
        <circle cx="84" cy="32" r="21" />
        <path d="M0 22 q7 -5 14 0 t14 0 t14 0 t14 0" />
        <path d="M0 32 q7 -5 14 0 t14 0 t14 0 t14 0" />
        <path d="M0 42 q7 -5 14 0 t14 0 t14 0 t14 0" />
      </g>
      <text
        x="84"
        y="30"
        textAnchor="middle"
        className="fill-current font-display text-tag"
      >
        THRIVE
      </text>
      <text
        x="84"
        y="42"
        textAnchor="middle"
        className="fill-current font-display text-tag"
      >
        POST
      </text>
    </motion.svg>
  );
}
