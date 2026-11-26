import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { Postmark } from '@/components/atoms/postmark';
import { Text } from '@/components/atoms/text';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import { HR_LANDING_COPY } from './hr-landing-copy.constant';

const { hero, demoHref } = HR_LANDING_COPY;

/** Where each of the three postcards lies in the pile, and the hue of the act it carries. */
const PILE = {
  ask: 'top-4 left-0 -rotate-6 bg-action-tertiary-surface-hover',
  give: 'top-36 left-10 rotate-3 bg-action-primary-surface-hover',
  kudos: 'top-72 left-4 -rotate-2 bg-action-secondary-surface-hover',
} as const;

function PileCard({
  at,
  label,
  children,
}: {
  at: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'absolute flex w-4/5 flex-col gap-1.5 rounded-element border border-border-muted p-inset-card shadow-med',
        at,
      )}
    >
      <Text variant="overline" tone="muted">
        {label}
      </Text>
      {children}
    </div>
  );
}

/**
 * The promise for whoever looks after the people, and the one way in, beside a pile of the post a
 * team sends in Thrive: one card asked, one given, one Kudos. The pile is a still picture from a
 * made-up team; the page for teams is where a visitor writes cards of their own. The heading is the
 * page's `h1`, and names what the tab's title names.
 */
export function HrLandingHero() {
  const { cards } = hero;
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto grid w-full max-w-5xl items-center gap-14 pt-4 md:grid-cols-2 md:pt-10"
    >
      <div className="flex flex-col gap-6">
        <Text variant="overline" tone="brand">
          {hero.eyebrow}
        </Text>
        <div className="flex flex-col gap-3">
          <Text
            as="h1"
            id="hero-title"
            variant="display-1"
            className="text-balance"
          >
            {hero.headline}
          </Text>
          <HandwrittenNote tilt="left">{hero.note}</HandwrittenNote>
        </div>
        <Text variant="subtitle-1" tone="muted" className="text-pretty">
          {hero.lead}
        </Text>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href={demoHref}>{hero.demo}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href={ROUTES.forTeams}>{hero.teams}</Link>
            </Button>
          </div>
          <Text variant="body-2" tone="muted">
            {hero.demoNote}
          </Text>
        </div>
      </div>
      <figure className="relative m-0 h-112">
        <div aria-hidden="true">
          <PileCard at={PILE.ask} label={cards.ask.label}>
            <Text variant="subtitle-display-3">{cards.ask.text}</Text>
          </PileCard>
          <PileCard at={PILE.give} label={cards.give.label}>
            <Text variant="subtitle-display-3">{cards.give.text}</Text>
          </PileCard>
          <PileCard at={PILE.kudos} label={cards.kudos.label}>
            <Text variant="body-1">
              {cards.kudos.before}{' '}
              <span className="rounded-chip bg-action-secondary-surface px-1.5 text-action-secondary-fg">
                {cards.kudos.mention}
              </span>{' '}
              {cards.kudos.after}
            </Text>
          </PileCard>
          <Postmark
            words={{ top: hero.postmark.top, bottom: hero.postmark.bottom }}
            centre={hero.postmark.centre}
            className="absolute top-0 right-0 w-36 rotate-12"
          />
        </div>
        <Text
          as="figcaption"
          variant="caption"
          tone="muted"
          className="absolute right-0 bottom-0"
        >
          {hero.caption}
        </Text>
      </figure>
    </section>
  );
}
