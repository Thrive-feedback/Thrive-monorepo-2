import { cva, type VariantProps } from 'class-variance-authority';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import styles from './landing-note.module.css';

/** Exported so a handwritten figure can write itself on the way a note does. */
export const writeOn = styles.writeOn;

const note = cva(
  'pointer-events-none block w-fit select-none text-action-secondary-hover',
  {
    variants: {
      tilt: {
        left: '-rotate-3',
        right: 'rotate-3',
      },
    },
    defaultVariants: { tilt: 'right' },
  },
);

export type LandingNoteProps = VariantProps<typeof note> & {
  children: React.ReactNode;
  className?: string;
};

/**
 * A teammate's note in the margin, in the handwriting face and the secondary colour, which on
 * this page belongs to the human voice as purple belongs to the product. It repeats nothing a
 * visitor needs, so assistive technology skips it.
 */
export function LandingNote({ tilt, className, children }: LandingNoteProps) {
  return (
    <Text
      as="span"
      variant="subtitle-handwrite-1"
      aria-hidden="true"
      className={cn(note({ tilt }), writeOn, className)}
    >
      {children}
    </Text>
  );
}
