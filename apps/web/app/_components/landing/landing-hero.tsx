import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { LANDING_COPY } from './landing-copy.constant';
import { NotedText } from './landing-note';

const { hero, tour } = LANDING_COPY;

/**
 * The promise, said to a founder, and the one way in, centred over the tour of Home that follows
 * it. The heading is the page's `h1`, and names what the tab's title names; its last words carry a
 * hand-drawn underline and a teammate's note sits in its margin.
 */
export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 pt-8 text-center md:pt-16"
    >
      <div className="flex flex-col items-center gap-5">
        <Text
          as="h1"
          id="hero-title"
          variant="display-1"
          className="text-balance"
        >
          <NotedText text={hero.headlineStart} note={hero.note} />
          {hero.headlineJoin}
          <span className="relative inline-block whitespace-nowrap">
            {hero.headlineMark}
            <HandUnderline />
          </span>
        </Text>
        <Text variant="subtitle-1" tone="muted" className="text-balance">
          {hero.lead}
        </Text>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-x-6 gap-y-4 sm:flex-row">
          <Button asChild variant="primary" size="lg">
            <Link href={ROUTES.signIn}>{hero.cta}</Link>
          </Button>
          <a href={`#${tour.id}`} className={link()}>
            {hero.tourLink}
          </a>
        </div>
        <Text variant="body-2" tone="muted">
          {hero.ctaNote}
        </Text>
      </div>
    </section>
  );
}

/** Two quick pen strokes under the words they mark, drawn in the secondary colour. */
function HandUnderline() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 16"
      preserveAspectRatio="none"
      fill="none"
      className="absolute -bottom-2 left-0 h-4 w-full overflow-visible text-action-secondary"
    >
      <path
        d="M3 9 C 48 3, 120 2, 197 7"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M24 14 C 80 9, 146 9, 186 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
