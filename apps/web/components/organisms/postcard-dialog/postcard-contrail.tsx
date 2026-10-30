import { motion } from 'motion/react';
import { useId } from 'react';
import styles from './postcard.module.css';

export type PostcardContrailProps = {
  ref: React.Ref<SVGSVGElement>;
  /** The course the card flies, as an SVG path in this layer's pixels; none before a send. */
  course: string | null;
};

/**
 * The dashed line a sent card leaves behind it. The layer covers the dialog and scrolls with it,
 * so the course is measured against it. Dashes cannot be drawn on by their own length, which is
 * already the dashes, so a mask under them is drawn on instead. Decoration only.
 */
export function PostcardContrail({ ref, course }: PostcardContrailProps) {
  const maskId = useId();

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full overflow-visible text-fg-muted"
    >
      {course && (
        <>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <motion.path
              data-contrail-reveal
              d={course}
              initial={{ pathLength: 0 }}
              className={styles.contrailMask}
            />
          </mask>
          <path
            d={course}
            mask={`url(#${maskId})`}
            className={styles.contrail}
          />
        </>
      )}
    </svg>
  );
}
