import { cva, type VariantProps } from 'class-variance-authority';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';

const section = cva('mx-auto flex w-full max-w-5xl flex-col gap-10', {
  variants: {
    surface: {
      none: '',
      subtle:
        'rounded-page bg-surface-subtle px-inset-container py-inset-section md:px-inset-section',
    },
  },
  defaultVariants: { surface: 'none' },
});

/** The eyebrow takes either brand colour, so the sections alternate down the page. */
const eyebrowColour = cva('', {
  variants: {
    accent: {
      primary: 'text-fg-accent',
      secondary: 'text-action-secondary',
    },
  },
  defaultVariants: { accent: 'primary' },
});

export type LandingSectionProps = VariantProps<typeof section> &
  VariantProps<typeof eyebrowColour> & {
    /** Names the heading, which in turn names the section for assistive technology. */
    id: string;
    /** A handwritten line over the heading. */
    eyebrow: string;
    title: string;
    lead?: string;
    className?: string;
    children: React.ReactNode;
  };

/**
 * One section of the landing page: a handwritten eyebrow, an `h2`, an optional lead, then the
 * section's own content. Every section shares this frame, so they line up and step down the
 * page at one rhythm.
 */
export function LandingSection({
  id,
  eyebrow,
  title,
  lead,
  surface,
  accent,
  className,
  children,
}: LandingSectionProps) {
  const headingId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(section({ surface }), className)}
    >
      <header className="flex max-w-2xl flex-col gap-3">
        <Text
          as="p"
          variant="subtitle-handwrite-3"
          className={eyebrowColour({ accent })}
        >
          {eyebrow}
        </Text>
        <Text as="h2" id={headingId} variant="display-4">
          {title}
        </Text>
        {lead && (
          <Text variant="subtitle-2" tone="muted">
            {lead}
          </Text>
        )}
      </header>
      {children}
    </section>
  );
}
