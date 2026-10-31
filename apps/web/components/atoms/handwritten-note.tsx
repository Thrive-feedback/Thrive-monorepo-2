import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn.util';
import styles from './handwritten-note.module.css';
import { Text } from './text';

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

export type HandwrittenNoteProps = VariantProps<typeof note> & {
  /** How large it is written. */
  size?: 'lg' | 'md';
  children: React.ReactNode;
  className?: string;
};

/**
 * A teammate's note in the margin, in the handwriting face and the secondary colour, which belongs
 * to the human voice as purple belongs to the product. It repeats nothing anyone needs, so
 * assistive technology skips it.
 */
export function HandwrittenNote({
  tilt,
  size = 'lg',
  children,
  className,
}: HandwrittenNoteProps) {
  return (
    <Text
      as="span"
      variant={size === 'lg' ? 'subtitle-handwrite-1' : 'subtitle-handwrite-2'}
      aria-hidden="true"
      className={cn(note({ tilt }), writeOn, className)}
    >
      {children}
    </Text>
  );
}
