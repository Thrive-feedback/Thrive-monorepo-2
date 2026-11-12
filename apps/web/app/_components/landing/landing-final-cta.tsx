import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { Logo } from '@/components/atoms/logo';
import { Postmark } from '@/components/atoms/postmark';
import { Text } from '@/components/atoms/text';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import styles from './landing.module.css';
import { LANDING_COPY } from './landing-copy.constant';
import {
  LandingKudosSmall,
  LandingPostcardScaled,
  LandingStamp,
} from './landing-moment-card';
import { BOARD_KUDOS, DESK_CARDS } from './landing-team.mock';

const { envelope } = LANDING_COPY;

/** The stamp on the envelope: one of the app's own, the balloon, which nothing else here carries. */

const ENVELOPE_STAMP = 'system/stamp-05-balloon';

/**
 * The post lying on the desk around the letter, from the made-up team: three Kudos from the board
 * and two postcards that came back. Each lies at its own height, distance, size and angle, so the two
 * sides never mirror each other, and stays inside the band's margin where a wide screen leaves room.
 */
const STREWN = [
  {
    at: 'top-28 right-full mr-6 w-40',
    lean: styles.strewnSteepLeft,
    kudos: BOARD_KUDOS[3],
  },
  {
    at: 'top-1/2 right-full mr-16 w-56',
    lean: styles.strewnEasyRight,
    postcard: DESK_CARDS.give,
  },
  {
    at: 'top-4 left-full ml-20 w-36',
    lean: styles.strewnSteepRight,
    kudos: BOARD_KUDOS[1],
  },
  {
    at: 'top-5/12 left-full ml-6 w-52',
    lean: styles.strewnEasyLeft,
    postcard: DESK_CARDS.ask,
  },
  {
    at: 'top-2/3 left-full ml-24 w-32',
    lean: styles.strewnMidLeft,
    kudos: BOARD_KUDOS[2],
  },
] as const;

/**
 * The page's last word, as a letter: an envelope from Thrive addressed to whoever leads the team,
 * with the letter rising out of it as it comes into view. The letter says why a lead goes first
 * and holds the way in again. The address is the section's heading, so it comes first in the
 * markup; on the page the letter stands above the envelope it came out of.
 */
export function LandingFinalCta() {
  return (
    <section
      aria-labelledby="envelope-title"
      className="relative mx-auto flex w-full max-w-2xl flex-col-reverse"
    >
      {/*
       * The envelope's front, over the bottom of the letter it held: white stationery in either
       * mode, edged in airmail stripes, as tall as a postcard is for its width. Its ink stays dark
       * on the white, so its words take the paper's own foreground, not the page's.
       */}
      <div
        className={cn(
          'relative z-20 -mt-16 flex aspect-3/2 min-h-60 flex-col justify-end rounded-element bg-surface-paper p-inset-card text-fg-on-paper md:p-inset-container',
          styles.envelope,
        )}
      >
        <div className="absolute top-6 left-inset-card flex flex-col md:top-8 md:left-inset-container">
          <Text
            as="span"
            variant="overline"
            className="text-fg-on-paper-secondary"
          >
            {envelope.from}
          </Text>
          {/* The sender is Thrive itself, so its wordmark stands for the name, as on letterhead. */}
          <Logo className="mt-1 aspect-10/3 h-auto w-20 md:w-24" />
        </div>
        {/* One of the app's own stamps, as a postcard carries one; it places itself 5px in from
            this point, its holder's top right corner. */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <LandingStamp stampKey={ENVELOPE_STAMP} />
        </div>
        <Postmark
          words={{
            top: envelope.postmark.top,
            bottom: envelope.postmark.bottom,
          }}
          centre={envelope.postmark.centre}
          trail="right"
          // Struck across the stamp, cancelling it, as on every postcard the app sends: over it,
          // and drawn above it.
          className={cn(
            'absolute top-9 right-3 z-30 w-28 md:top-12 md:right-5 md:w-32',
            styles.postmark,
          )}
        />
        <div className="flex flex-col gap-1 sm:w-2/5 sm:self-end">
          <Text
            as="span"
            variant="overline"
            className="text-fg-on-paper-secondary"
          >
            {envelope.to}
          </Text>
          <Text
            as="h2"
            id="envelope-title"
            variant="subtitle-handwrite-1"
            className="w-full border-fg-on-paper-secondary border-b pb-0.5 md:text-display-4"
          >
            {envelope.address}
          </Text>
        </div>
      </div>

      {/*
       * The letter, risen out of the envelope, in front of the envelope's flap: opened and
       * standing up behind it, its plum liner showing either side of the letter. The flap's
       * foot is the envelope's top edge, which overlaps the letter's foot by as much.
       */}
      <div className="relative">
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 bottom-16 aspect-10/3',
            styles.flap,
          )}
        />
        <div
          className={cn(
            'relative z-10 mx-8 flex flex-col gap-8 rounded-element border border-border-muted bg-surface-base p-inset-card pb-24 md:mx-20 md:p-inset-container md:pb-28',
            styles.letter,
          )}
        >
          <Text variant="subtitle-1" tone="muted" className="text-pretty">
            {envelope.lead}
          </Text>
          {/* Steps, so an ordered list; each numbered by hand in the blue of asking, which is a
              picture of what the list's own numbering already says. */}
          <ol className="flex flex-col gap-6">
            {envelope.points.map((point, index) => (
              <li key={point.title} className="flex flex-col gap-1">
                <HandwrittenNote
                  size="md"
                  tilt="left"
                  className="text-action-tertiary"
                >
                  {`${envelope.step} ${index + 1}`}
                </HandwrittenNote>
                <Text as="h3" variant="subtitle-2">
                  {point.title}
                </Text>
                <Text variant="body-2" tone="muted" className="text-pretty">
                  {point.body}
                </Text>
              </li>
            ))}
          </ol>
          <div className="flex flex-col items-center gap-5 border-border-subtle border-t pt-8 text-center">
            <Text as="p" variant="display-3" className="text-balance">
              {envelope.title}
            </Text>
            <Text variant="subtitle-1" tone="muted">
              {envelope.body}
            </Text>
            <div className="flex flex-col items-center gap-2">
              <Button asChild variant="primary" size="lg">
                <Link href={ROUTES.signIn}>{envelope.cta}</Link>
              </Button>
              <HandwrittenNote tilt="left">{envelope.note}</HandwrittenNote>
            </div>
          </div>
        </div>
        {/*
         * Post lying on the desk either side of the letter, where a wide screen leaves room for it,
         * placed against the letter, so none drops below the envelope's top edge.
         * Pictures, so assistive technology skips them.
         */}
        {STREWN.map((item) => (
          <div
            key={item.at}
            aria-hidden="true"
            className={cn('absolute hidden xl:block', item.at, item.lean)}
          >
            <div className="rounded-element shadow-high">
              {'kudos' in item ? (
                item.kudos && <LandingKudosSmall kudos={item.kudos} />
              ) : (
                <LandingPostcardScaled card={item.postcard} />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
