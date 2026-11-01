import { cva, type VariantProps } from 'class-variance-authority';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import styles from './handwritten-note.module.css';

const note = cva(
  'pointer-events-none block w-fit select-none text-action-secondary-hover',
  {
    variants: {
      tilt: {
        left: '-rotate-3',
        right: 'rotate-3',
      },
      /** A note on a page is written as it is scrolled to; nothing scrolls a note in a dialog. */
      writes: {
        'on-scroll': styles.writeOn,
        'on-open': styles.writeOnOpen,
      },
    },
    defaultVariants: { tilt: 'right', writes: 'on-scroll' },
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
  writes,
  size = 'lg',
  children,
  className,
}: HandwrittenNoteProps) {
  return (
    <Text
      as="span"
      variant={size === 'lg' ? 'subtitle-handwrite-1' : 'subtitle-handwrite-2'}
      aria-hidden="true"
      className={cn(note({ tilt, writes }), className)}
    >
      {children}
    </Text>
  );
}
