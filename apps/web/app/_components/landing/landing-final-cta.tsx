import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { LANDING_COPY } from './landing-copy.constant';

const { finalCta } = LANDING_COPY;

/** The way in again, for a visitor who read to the end. */
export function LandingFinalCta() {
  return (
    <section
      aria-labelledby="final-cta-title"
      className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 rounded-page bg-action-primary-surface px-inset-container py-inset-section text-center md:px-inset-section"
    >
      <Text
        as="h2"
        id="final-cta-title"
        variant="display-4"
        className="max-w-2xl"
      >
        {finalCta.title}
      </Text>
      <Text variant="subtitle-2" tone="muted">
        {finalCta.body}
      </Text>
      <Button asChild variant="highlight" size="lg">
        <Link href={ROUTES.signIn}>{finalCta.cta}</Link>
      </Button>
    </section>
  );
}
