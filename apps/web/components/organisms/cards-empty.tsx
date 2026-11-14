import { Text } from '@/components/atoms/text';
import {
  FEED_CARD_EDGE,
  FEED_CARD_GROUND,
  FEED_CARD_INK,
} from '@/components/organisms/feed-card/feed-card-tone.constant';
import type { FeedCardTone } from '@/components/organisms/feed-card/feed-card-tone.type';
import { cn } from '@/lib/cn.util';

/** Which cards an empty place is waiting for: one kind, in its colour, or every kind at once. */
export type CardsEmptyArt = FeedCardTone | 'every';

type OutlineProps = {
  tone: FeedCardTone;
  /** A Kudos card stands; a postcard lies. */
  shape: 'postcard' | 'kudos';
  className?: string;
};

/**
 * A card not yet written, as the Kudos board leaves a place for one: a dashed edge round a blank
 * card, in its kind's colour. The page's colour under the tint keeps cards laid over each other from
 * showing through.
 */
function Outline({ tone, shape, className }: OutlineProps) {
  return (
    <span
      className={cn(
        'block overflow-hidden rounded-element border-2 border-dashed bg-surface-base',
        shape === 'postcard' ? 'aspect-3/2 w-36' : 'aspect-3/4 w-24',
        FEED_CARD_EDGE[tone],
        className,
      )}
    >
      <span className={cn('block size-full', FEED_CARD_GROUND[tone])} />
    </span>
  );
}

type ArtProps = {
  art: CardsEmptyArt;
};

/**
 * The cards the list is waiting for. One kind is one card, leaning; every kind is three fanned like
 * a hand of cards, a postcard either side of a Kudos.
 */
function Art({ art }: ArtProps) {
  if (art !== 'every') {
    return (
      <Outline
        tone={art}
        shape={art === 'secondary' ? 'kudos' : 'postcard'}
        className="-rotate-3"
      />
    );
  }
  return (
    <span className="relative block h-36 w-64">
      <Outline
        tone="primary"
        shape="postcard"
        className="absolute top-8 left-0 -rotate-8"
      />
      <Outline
        tone="tertiary"
        shape="postcard"
        className="absolute top-6 right-0 rotate-6"
      />
      <Outline
        tone="secondary"
        shape="kudos"
        className="absolute top-0 left-1/2 -translate-x-1/2 -rotate-2"
      />
    </span>
  );
}

export type CardsEmptyProps = {
  /** Which cards it is waiting for, drawn as blank cards in their colours. */
  art: CardsEmptyArt;
  /** What is not here yet, written by hand. */
  title: string;
  /**
   * The element the title is. A heading where the empty place is a page or a region of one; a
   * paragraph inside a menu, where ARIA allows no heading and the page's outline should not
   * gain one, such as the bell's panel.
   */
  titleAs?: 'h2' | 'p';
  /** What will be here, and how it gets here. */
  description?: string;
  /**
   * What to do from here, side by side: write the cards that fill it, or go where there are some.
   * Left out where the page already offers it, such as Home under its composer, or where there is
   * nothing to do, such as nobody waiting on the person.
   */
  children?: React.ReactNode;
};

/**
 * A place for cards with none in it, drawn alike wherever there is one, Home, Waiting for me,
 * Received, Given, the Kudos board and the bell: the blank cards it is waiting for, what is not
 * here yet written by hand in their colour, and what to do about it, in the middle of whatever
 * space the page leaves it, both ways.
 */
export function CardsEmpty({
  art,
  title,
  titleAs = 'h2',
  description,
  children,
}: CardsEmptyProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div aria-hidden="true" className="mb-4">
        <Art art={art} />
      </div>
      <Text
        as={titleAs}
        variant="subtitle-handwrite-1"
        className={art === 'every' ? 'text-fg-primary' : FEED_CARD_INK[art]}
      >
        {title}
      </Text>
      {description && (
        <Text as="p" variant="body-2" tone="muted" className="max-w-md">
          {description}
        </Text>
      )}
      {children && (
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
