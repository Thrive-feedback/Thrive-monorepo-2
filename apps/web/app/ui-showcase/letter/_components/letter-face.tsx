import { cva } from 'class-variance-authority';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import styles from './letter.module.css';

export type LetterSide = 'give' | 'request';

const face = cva(
  'relative col-start-1 row-start-1 flex min-h-120 flex-col overflow-hidden rounded-control border border-border-muted',
  {
    variants: {
      side: {
        give: cn(styles.face, styles.paper),
        request: cn(styles.face, styles.paper, styles.back),
      },
    },
  },
);

export type LetterFaceProps = {
  side: LetterSide;
  title: string;
  /** Whether this face points at the reader. The other one is out of reach of focus and of a screen reader. */
  shown: boolean;
  /**
   * What is on it: the writing, under the title, and any stamps, which are placed on the face as
   * a whole rather than in the writing's flow.
   */
  children: React.ReactNode;
};

/** One face of the letter: its title, then whatever is written and stuck on it. */
export function LetterFace({ side, title, shown, children }: LetterFaceProps) {
  return (
    <section aria-hidden={!shown} inert={!shown} className={face({ side })}>
      <div className="flex flex-1 flex-col gap-6 px-6 pt-6 pb-8 md:px-10 md:pt-8 md:pb-10">
        <Text variant="subtitle-display-1" as="h2" className="pt-2">
          {title}
        </Text>
        {children}
      </div>
    </section>
  );
}
