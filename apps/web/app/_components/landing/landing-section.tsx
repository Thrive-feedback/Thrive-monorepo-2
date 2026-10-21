import { cva, type VariantProps } from 'class-variance-authority';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import { LandingNote, NotedText } from './landing-note';

const section = cva('mx-auto grid w-full max-w-5xl gap-10', {
  variants: {
    layout: {
      stacked: 'md:gap-14',
      split: 'md:grid-cols-2 md:gap-gap-grid',
    },
  },
  defaultVariants: { layout: 'stacked' },
});

const header = cva('relative flex max-w-2xl flex-col gap-4', {
  variants: {
    align: {
      start: '',
      center: 'mx-auto items-center text-center',
    },
  },
  defaultVariants: { align: 'start' },
});

/**
 * Under the heading, until `lg` moves it to the heading's corner; a split section keeps it under
 * the heading, since its own column sits where the corner would be.
 */
const notePlacement = cva('', {
  variants: {
    layout: {
      stacked: 'lg:hidden',
      split: '',
    },
  },
  defaultVariants: { layout: 'stacked' },
});

export type LandingSectionProps = VariantProps<typeof header> &
  VariantProps<typeof section> & {
    /** Names the heading, which in turn names the section for assistive technology. */
    id: string;
    title: string;
    lead?: string;
    /** A handwritten aside for the heading. */
    note?: string;
    className?: string;
    children: React.ReactNode;
  };

/**
 * One section of the landing page: an `h2` set in the display face, an optional lead and
 * handwritten note, then the
 * section's own content, below it or, `split`, beside it from `md` up. Sections are told apart by
 * space and hairlines rather than panels, so every section shares this frame and steps down the
 * page at one rhythm.
 */
export function LandingSection({
  id,
  title,
  lead,
  note,
  align,
  layout,
  className,
  children,
}: LandingSectionProps) {
  const headingId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(section({ layout }), className)}
    >
      <header className={header({ align })}>
        <Text
          as="h2"
          id={headingId}
          variant="display-2"
          className="text-balance"
        >
          {note && layout !== 'split' ? (
            <NotedText text={title} note={note} />
          ) : (
            title
          )}
        </Text>
        {lead && (
          <Text variant="subtitle-1" tone="muted">
            {lead}
          </Text>
        )}
        {note && (
          <LandingNote className={notePlacement({ layout })}>
            {note}
          </LandingNote>
        )}
      </header>
      {children}
    </section>
  );
}
