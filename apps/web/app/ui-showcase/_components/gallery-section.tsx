import { useId } from 'react';
import { Text } from '@/components/atoms/text';

export type GallerySectionProps = {
  title: string;
  /** What the group is, under its heading. */
  description?: string;
  children: React.ReactNode;
};

/**
 * One group on any showcase page: a heading over a rule, what the group is, then what it shows.
 * The section is named by its heading, so each one is a landmark a screen reader can jump to.
 */
export function GallerySection({
  title,
  description,
  children,
}: GallerySectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <header className="flex flex-col gap-1 border-border-default border-b pb-3">
        <Text variant="subtitle-2" as="h2" id={headingId}>
          {title}
        </Text>
        {description && (
          <Text variant="body-2" tone="muted" className="max-w-2xl">
            {description}
          </Text>
        )}
      </header>
      {children}
    </section>
  );
}
