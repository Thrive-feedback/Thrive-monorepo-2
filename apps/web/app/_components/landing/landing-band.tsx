import { cva, type VariantProps } from 'class-variance-authority';
import styles from './landing.module.css';

const band = cva('px-6 py-20 sm:px-10 md:py-32', {
  variants: {
    /**
     * Plain lets the page's own ground show; a tint is a hue's light surface, edge to edge, its
     * top and bottom perforated like a sheet of stamps, so the edge of one section reads as the
     * tear before the next.
     */
    tint: {
      plain: '',
      // Half the tint's strength: at full strength the blue reads as a heavy navy in dark mode.
      ask: ['bg-action-tertiary-surface-hover/50', styles.perforated],
      thanks: ['bg-action-secondary-surface-hover', styles.perforated],
      give: ['bg-action-primary-surface-hover', styles.perforated],
    },
    /** The first band, under the navbar: the hero needs no room above it beyond its own. */
    opening: {
      true: 'pt-8 md:pt-8',
      false: '',
    },
  },
  defaultVariants: { tint: 'plain', opening: false },
});

export type LandingBandProps = VariantProps<typeof band> & {
  children: React.ReactNode;
};

/**
 * The full width a landing section stands on. Sections alternate between the plain page and a
 * tinted band, so scrolling from one to the next crosses an edge: a visitor always sees where a
 * section ends.
 */
export function LandingBand({ tint, opening, children }: LandingBandProps) {
  return <div className={band({ tint, opening })}>{children}</div>;
}
