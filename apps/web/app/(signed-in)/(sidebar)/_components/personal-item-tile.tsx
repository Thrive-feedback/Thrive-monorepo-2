import { memo, useState } from 'react';
import type {
  PersonalFeedback,
  PersonalItem,
  PersonalKudos,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-item.type';
import {
  everyoneNamedIn,
  otherPeopleOn,
  tileNamesOf,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-item-people.util';
import { PERSONAL_ITEM_TILE } from '@/app/(signed-in)/(brand-new)/_lib/personal-items-layout.constant';
import {
  PERSONAL_ITEMS_ROUTES,
  type PersonalItemsSide,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-items-side.constant';
import { useReceivedShow } from '@/app/(signed-in)/(brand-new)/_lib/use-received-show';
import { Badge } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import { PeopleStack } from '@/components/molecules/people-stack';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { TargetLink } from '@/components/molecules/target-link';
import { feedCardAudienceOf } from '@/components/organisms/feed-card/feed-card-audience.util';
import {
  NO_NAME_IN_A_SENTENCE,
  NO_NAME_STARTING_A_SENTENCE,
} from '@/components/organisms/feed-card/feed-card-sentence.util';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { kudosCardDate } from '@/components/organisms/kudos-dialog/kudos-card.util';
import { KudosCardReadDialog } from '@/components/organisms/kudos-dialog/kudos-card-read-dialog';
import { KudosCardReadOnly } from '@/components/organisms/kudos-dialog/kudos-card-read-only';
import { kudosTiltOf } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { PersonName } from '@/components/organisms/person-name';
import { PostcardMiniature } from '@/components/organisms/postcard-miniature/postcard-miniature';
import { cn } from '@/lib/cn.util';
import type { HomeFeedPerson } from '@/lib/feedback/home-feed-item.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { timeAgo } from '@/lib/time-ago.util';
import styles from './personal-item-tile.module.css';
import { PersonalItemTilePending } from './personal-item-tile-pending';

type TileCornerProps = {
  item: PersonalItem;
  readerAccountId: string;
};

/** What can be read about who else may read it, in the box's corner. */
function TileCorner({ item, readerAccountId }: TileCornerProps) {
  if (item.kind === 'KUDOS') {
    return <Badge>Kudos</Badge>;
  }
  const { Icon } = feedCardAudienceOf(item, readerAccountId);
  return (
    <Icon aria-hidden="true" className="size-4 shrink-0 text-fg-secondary" />
  );
}

type TileFacesProps = {
  people: readonly HomeFeedPerson[];
};

/** Whose box this is, in faces. A Kudos for the whole Workspace names nobody to show. */
function TileFaces({ people }: TileFacesProps) {
  const [onlyPerson] = people;

  if (!onlyPerson) {
    return null;
  }
  return people.length === 1 ? (
    <PhotoAvatar name={onlyPerson.name ?? ''} photoUrl={onlyPerson.photoUrl} />
  ) : (
    <PeopleStack people={people} />
  );
}

type TileNameProps = {
  people: readonly HomeFeedPerson[];
};

/** Whose box this is, in words: one person whole, several by first name. */
function TileName({ people }: TileNameProps) {
  const [onlyPerson] = people;

  if (!onlyPerson) {
    return 'The whole Workspace';
  }
  return people.length === 1 ? (
    <PersonName
      name={onlyPerson.name ?? NO_NAME_STARTING_A_SENTENCE}
      inactive={onlyPerson.inactive}
    />
  ) : (
    tileNamesOf(people)
  );
}

type TileProps = {
  item: PersonalItem;
  side: PersonalItemsSide;
  readerAccountId: string;
  /** What the press does. */
  target: NavTarget;
  /** What the press says it does, in full. */
  name: string;
  /** The real card, made small. */
  children: React.ReactNode;
};

/**
 * One thing in a Member's own list: who is at the other end of it and how long ago, the real card
 * made small, and the first of the words. The whole box is one press, which opens the card, where
 * the rest can be read. The card leans as it would hanging on the board, and stays still under the
 * cursor.
 *
 * The hidden name says how long ago, as the visible line does. The server and the browser can read
 * the clock either side of a minute, so the browser keeps what the server wrote.
 */
function Tile({
  item,
  side,
  readerAccountId,
  target,
  name,
  children,
}: TileProps) {
  const people = otherPeopleOn(item, side);

  return (
    <article className={PERSONAL_ITEM_TILE}>
      <header className="flex min-w-0 items-center gap-2">
        <TileFaces people={people} />
        <div className="min-w-0 flex-1">
          <Text as="p" variant="subtitle-4" className="truncate">
            <TileName people={people} />
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            <TimeAgo dateTime={item.givenAt} />
          </Text>
        </div>
        <TileCorner item={item} readerAccountId={readerAccountId} />
      </header>
      <TargetLink
        target={target}
        className={cn(
          'block w-full font-normal after:absolute after:inset-0 after:rounded-page',
          styles.press,
        )}
      >
        <span className="sr-only" suppressHydrationWarning>
          {name}
        </span>
        <span
          style={{ rotate: `${kudosTiltOf(item.id)}deg` }}
          className="flex justify-center p-2"
        >
          {children}
        </span>
        {'href' in target && <PersonalItemTilePending />}
      </TargetLink>
      <Text as="p" variant="body-2" className="line-clamp-2 break-words">
        <FeedbackText text={item.message} tags={item.messageTags} />
      </Text>
    </article>
  );
}

/** Who a card is from or for, as a press names them. */
function fromOrTo(item: PersonalItem, side: PersonalItemsSide) {
  return side === 'received'
    ? `from ${item.giver.name ?? NO_NAME_IN_A_SENTENCE}`
    : `to ${everyoneNamedIn(otherPeopleOn(item, side))}`;
}

type PostcardTileProps = {
  item: PersonalFeedback;
  side: PersonalItemsSide;
  readerAccountId: string;
};

function PostcardTile({ item, side, readerAccountId }: PostcardTileProps) {
  const { label } = feedCardAudienceOf(item, readerAccountId);
  const show = useReceivedShow();

  return (
    <Tile
      item={item}
      side={side}
      readerAccountId={readerAccountId}
      target={{
        href: PERSONAL_ITEMS_ROUTES[side].feedback(item.id, 'grid', show),
      }}
      name={`Postcard ${fromOrTo(item, side)}, ${timeAgo(item.givenAt)}, ${label}. Opens the postcard.`}
    >
      <PostcardMiniature card={item.card} />
    </Tile>
  );
}

type KudosTileProps = {
  item: PersonalKudos;
  side: PersonalItemsSide;
  readerAccountId: string;
};

function KudosTile({ item, side, readerAccountId }: KudosTileProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Tile
        item={item}
        side={side}
        readerAccountId={readerAccountId}
        target={{ onSelect: () => setIsOpen(true) }}
        name={`Kudos ${fromOrTo(item, side)}, ${timeAgo(item.givenAt)}. Opens the kudos card.`}
      >
        {/* Half as wide, a portrait card stands as tall as a postcard lies, so rows stay level. */}
        <span aria-hidden="true" className="w-1/2">
          <KudosCardReadOnly
            message={item.message}
            tags={item.messageTags}
            drawing={item.drawing}
            date={kudosCardDate(item.givenAt)}
          />
        </span>
      </Tile>
      <KudosCardReadDialog
        kudos={item}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}

export type PersonalItemTileProps = {
  item: PersonalItem;
  side: PersonalItemsSide;
  /** Who is reading, so the box can say who else may read it from their side. */
  readerAccountId: string;
};

/**
 * One box in the grid, by what it holds. Each draws a whole card, and an item keeps its identity
 * between renders, so a box is left alone while the list around it changes.
 */
export const PersonalItemTile = memo(function PersonalItemTile({
  item,
  side,
  readerAccountId,
}: PersonalItemTileProps) {
  return item.kind === 'KUDOS' ? (
    <KudosTile item={item} side={side} readerAccountId={readerAccountId} />
  ) : (
    <PostcardTile item={item} side={side} readerAccountId={readerAccountId} />
  );
});
