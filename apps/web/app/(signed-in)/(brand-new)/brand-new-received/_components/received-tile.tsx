import { memo, useState } from 'react';
import type {
  ReceivedFeedback,
  ReceivedItem,
  ReceivedKudos,
} from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-item.type';
import { RECEIVED_TILE } from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-layout.constant';
import { Badge } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
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
import { cn } from '@/lib/cn.util';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { ROUTES } from '@/lib/routes.constant';
import { timeAgo } from '@/lib/time-ago.util';
import { PostcardMiniature } from './postcard-miniature';
import styles from './received-tile.module.css';
import { ReceivedTilePending } from './received-tile-pending';

type TileCornerProps = {
  item: ReceivedItem;
};

/** What can be read about who else may read it, in the box's corner. */
function TileCorner({ item }: TileCornerProps) {
  if (item.kind === 'KUDOS') {
    return <Badge>Kudos</Badge>;
  }
  const { Icon } = feedCardAudienceOf(item);
  return (
    <Icon aria-hidden="true" className="size-4 shrink-0 text-fg-secondary" />
  );
}

type TileProps = {
  item: ReceivedItem;
  /** What the press does. */
  target: NavTarget;
  /** What the press says it does, in full. */
  name: string;
  /** The real card, made small. */
  children: React.ReactNode;
};

/**
 * One thing written to the person: who wrote it and how long ago, the real card made small, and the
 * first of the words. The whole box is one press, which opens the card, where the rest can be read.
 * The card leans as it would hanging on the board, and stays still under the cursor.
 *
 * The hidden name says how long ago, as the visible line does. The server and the browser can read
 * the clock either side of a minute, so the browser keeps what the server wrote.
 */
function Tile({ item, target, name, children }: TileProps) {
  return (
    <article className={RECEIVED_TILE}>
      <header className="flex min-w-0 items-center gap-2">
        <PhotoAvatar
          name={item.giver.name ?? ''}
          photoUrl={item.giver.photoUrl}
        />
        <div className="min-w-0 flex-1">
          <Text as="p" variant="subtitle-4" className="truncate">
            <PersonName
              name={item.giver.name ?? NO_NAME_STARTING_A_SENTENCE}
              inactive={item.giver.inactive}
            />
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            <TimeAgo dateTime={item.givenAt} />
          </Text>
        </div>
        <TileCorner item={item} />
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
        {'href' in target && <ReceivedTilePending />}
      </TargetLink>
      <Text as="p" variant="body-2" className="line-clamp-2 break-words">
        <FeedbackText text={item.message} tags={item.messageTags} />
      </Text>
    </article>
  );
}

type PostcardTileProps = {
  item: ReceivedFeedback;
};

function PostcardTile({ item }: PostcardTileProps) {
  const giver = item.giver.name ?? NO_NAME_IN_A_SENTENCE;
  const { label } = feedCardAudienceOf(item);

  return (
    <Tile
      item={item}
      target={{ href: ROUTES.brandNewReceivedFeedback(item.id) }}
      name={`Postcard from ${giver}, ${timeAgo(item.givenAt)}, ${label}. Opens the postcard.`}
    >
      <PostcardMiniature card={item.card} />
    </Tile>
  );
}

type KudosTileProps = {
  item: ReceivedKudos;
};

function KudosTile({ item }: KudosTileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const giver = item.giver.name ?? NO_NAME_IN_A_SENTENCE;

  return (
    <>
      <Tile
        item={item}
        target={{ onSelect: () => setIsOpen(true) }}
        name={`Kudos from ${giver}, ${timeAgo(item.givenAt)}. Opens the kudos card.`}
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

export type ReceivedTileProps = {
  item: ReceivedItem;
};

/**
 * One box in the grid of Received, by what it holds. Each draws a whole card, and an item keeps its
 * identity between renders, so a box is left alone while the list around it changes.
 */
export const ReceivedTile = memo(function ReceivedTile({
  item,
}: ReceivedTileProps) {
  return item.kind === 'KUDOS' ? (
    <KudosTile item={item} />
  ) : (
    <PostcardTile item={item} />
  );
});
