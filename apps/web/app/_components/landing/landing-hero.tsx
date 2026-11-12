import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { HandUnderline } from '@/components/atoms/hand-underline';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingDesk } from './landing-desk';
import { NotedText } from './landing-note';

const { hero } = LANDING_COPY;

/**
 * The promise and the one way in, centred, over a spread of the cards it is kept on. The heading
 * is the page's `h1`, and names what the tab's title names; its last words carry a hand-drawn
 * underline and a teammate's note sits in its margin.
 */
export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12 pt-4 md:gap-16 md:pt-10"
    >
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-5">
          <Text
            as="h1"
            id="hero-title"
            variant="display-1"
            className="text-balance"
          >
            <NotedText text={hero.headlineStart} note={hero.note} />
            <br className="hidden md:inline" />
            {hero.headlineJoin}
            <HandUnderline>{hero.headlineMark}</HandUnderline>
          </Text>
          <Text
            variant="subtitle-1"
            tone="muted"
            className="max-w-2xl text-balance"
          >
            {hero.lead}
          </Text>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href={ROUTES.signIn}>{hero.cta}</Link>
          </Button>
          <Text variant="body-2" tone="muted">
            {hero.ctaNote}
          </Text>
        </div>
      </div>
      <LandingDesk />
    </section>
  );
}
