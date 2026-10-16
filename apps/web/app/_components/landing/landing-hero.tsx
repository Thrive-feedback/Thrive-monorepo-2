import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { LANDING_COPY } from './landing-copy.constant';

const { hero } = LANDING_COPY;

/**
 * The promise, said to a founder, and the one way in, centred over the preview of Home that
 * follows it. The heading is the page's `h1`, and names what the tab's title names (`FE_12` R10).
 */
export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center lg:pt-8"
    >
      <Text
        as="p"
        variant="subtitle-handwrite-2"
        className="text-action-secondary"
      >
        {hero.overline}
      </Text>
      <Text as="h1" id="hero-title" variant="display-1">
        {hero.headline}{' '}
        <Text as="span" variant="display-1" tone="brand">
          {hero.headlineBrand}
        </Text>
        {hero.headlineEnd}
      </Text>
      <Text variant="subtitle-2" tone="muted">
        {hero.lead}
      </Text>
      <div className="flex flex-col items-center gap-3">
        <Button asChild variant="primary" size="lg">
          <Link href={ROUTES.signIn}>{hero.cta}</Link>
        </Button>
        <Text variant="body-3" tone="muted">
          {hero.ctaNote}
        </Text>
      </div>
    </section>
  );
}
