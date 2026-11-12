import { cva, type VariantProps } from 'class-variance-authority';
import { Text } from '@/components/atoms/text';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { NotedText } from './landing-note';

const header = cva('relative flex max-w-2xl flex-col gap-4', {
  variants: {
    align: {
      start: '',
      center: 'mx-auto items-center text-center',
    },
  },
  defaultVariants: { align: 'start' },
});

export type LandingSectionProps = VariantProps<typeof header> & {
  /** Names the heading, which in turn names the section for assistive technology. */
  id: string;
  title: string;
  lead?: string;
  /**
   * A handwritten aside for the heading: at the corner of its first line from `lg` up, under the
   * heading below that.
   */
  note?: string;
  children: React.ReactNode;
};

/**
 * One section of the landing page: an `h2` set in the display face, an optional lead and
 * handwritten note, then the section's own content below it. Every section shares this frame; the
 * band it stands on (`LandingBand`) is what tells it apart from the next.
 */
export function LandingSection({
  id,
  title,
  lead,
  note,
  align,
  children,
}: LandingSectionProps) {
  const headingId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="mx-auto grid w-full max-w-5xl gap-10 md:gap-14"
    >
      <header className={header({ align })}>
        <Text
          as="h2"
          id={headingId}
          variant="display-2"
          className="text-balance"
        >
          {note ? <NotedText text={title} note={note} /> : title}
        </Text>
        {lead && (
          // A lead runs a few lines under its heading; balanced, so none ends on one word.
          <Text variant="subtitle-1" tone="muted" className="text-balance">
            {lead}
          </Text>
        )}
        {note && (
          <HandwrittenNote className="lg:hidden">{note}</HandwrittenNote>
        )}
      </header>
      {children}
    </section>
  );
}
