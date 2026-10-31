import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { ROUTES } from '@/lib/routes.constant';
import { LANDING_COPY } from './landing-copy.constant';

const { finalCta } = LANDING_COPY;

/** The way in again, for a visitor who read to the end, in the same colour as the first. */
export function LandingFinalCta() {
  return (
    <section
      aria-labelledby="final-cta-title"
      className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 py-8 text-center md:py-16"
    >
      <Text
        as="h2"
        id="final-cta-title"
        variant="display-1"
        className="text-balance"
      >
        {finalCta.title}
      </Text>
      <Text variant="subtitle-1" tone="muted">
        {finalCta.body}
      </Text>
      <div className="flex flex-col items-center gap-3">
        <Button asChild variant="primary" size="lg">
          <Link href={ROUTES.signIn}>{finalCta.cta}</Link>
        </Button>
        <HandwrittenNote tilt="left">{finalCta.note}</HandwrittenNote>
      </div>
    </section>
  );
}
