import { ArrowRightIcon, UsersIcon } from 'lucide-react';
import { memo, useRef } from 'react';
import { kudosCaptionName } from '@/app/(signed-in)/(brand-new)/kudos/_lib/kudos-board-place.util';
import { Text } from '@/components/atoms/text';
import { AvatarGroup } from '@/components/molecules/avatar-group';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { kudosCardDate } from '@/components/organisms/kudos-dialog/kudos-card.util';
import { KudosCardReadOnly } from '@/components/organisms/kudos-dialog/kudos-card-read-only';
import type {
  ReadKudos,
  ReadKudosPerson,
} from '@/components/organisms/kudos-dialog/read-kudos.type';
import { kudosTiltOf } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { PersonName } from '@/components/organisms/person-name';
import { cn } from '@/lib/cn.util';
import styles from './kudos-board.module.css';
import type { KudosBoardOffset, KudosBoardPlace } from './kudos-board-places';
import { useKudosBoardDrag } from './use-kudos-board-drag';

/** A caption has one line, so it shows two people and counts the rest. */
const NAMED_RECEIVERS = 2;

const GIVER_WITH_NO_NAME = 'A teammate';
const RECEIVER_WITH_NO_NAME = 'a teammate';

/** Where a card hangs until it is moved. */
const WHERE_IT_HANGS: KudosBoardOffset = { x: 0, y: 0 };

function Face({
  person,
  unnamed,
}: {
  person: ReadKudosPerson;
  unnamed: string;
}) {
  return (
    <PhotoAvatar
      name={person.name ?? unnamed}
      photoUrl={person.photoUrl}
      size="sm"
    />
  );
}

function Name({
  person,
  unnamed,
}: {
  person: ReadKudosPerson;
  unnamed: string;
}) {
  return (
    <PersonName
      name={kudosCaptionName(person.name, unnamed)}
      inactive={person.inactive}
    />
  );
}

/** A Kudos for the whole Workspace has no one face, so it gets the people icon where one would go. */
function EveryoneFace() {
  return (
    <span
      aria-hidden="true"
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-subtle"
    >
      <UsersIcon className="size-3.5" />
    </span>
  );
}

function ReceiverFaces({ item }: { item: ReadKudos }) {
  const [only] = item.recipients;
  if (!only) {
    return <EveryoneFace />;
  }
  if (item.recipients.length === 1) {
    return <Face person={only} unnamed={RECEIVER_WITH_NO_NAME} />;
  }
  return (
    <AvatarGroup
      aria-hidden="true"
      size="sm"
      max={NAMED_RECEIVERS}
      className="shrink-0"
    >
      {item.recipients.map((person, place) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a sent Kudos never changes who it names.
        <Face key={place} person={person} unnamed={RECEIVER_WITH_NO_NAME} />
      ))}
    </AvatarGroup>
  );
}

/** Who gave it to whom, face and first name: `Mali → Ben`, `Ben → Dao & Chai`, `Mali → Everyone`. */
function KudosBoardCaption({ item }: { item: ReadKudos }) {
  const [first, second] = item.recipients;
  const others = item.recipients.length - NAMED_RECEIVERS;

  return (
    <Text
      as="div"
      variant="caption"
      tone="muted"
      className={cn(
        'mt-2 flex h-6 min-w-0 items-center justify-center gap-1',
        styles.fit,
      )}
    >
      <Face person={item.giver} unnamed={GIVER_WITH_NO_NAME} />
      <span className="min-w-0 shrink truncate">
        <Name person={item.giver} unnamed={GIVER_WITH_NO_NAME} />
      </span>
      <ArrowRightIcon aria-hidden="true" className="size-3 shrink-0" />
      <span className="sr-only">to </span>
      <ReceiverFaces item={item} />
      <span className="min-w-0 shrink truncate">
        {first ? (
          <Name person={first} unnamed={RECEIVER_WITH_NO_NAME} />
        ) : (
          'Everyone'
        )}
        {second && (
          <>
            {' & '}
            <Name person={second} unnamed={RECEIVER_WITH_NO_NAME} />
          </>
        )}
        {others > 0 && ` +${others}`}
      </span>
    </Text>
  );
}

export type KudosBoardCardProps = {
  item: ReadKudos;
  /** Where this card was left, if it has been moved. */
  place: KudosBoardPlace | undefined;
  /** Its place on the page, so cards going back when tidied go one after another. */
  position: number;
  /** Showing its back. */
  isTurned: boolean;
  /** The board, which a card stays on. */
  boardRef: React.RefObject<HTMLElement | null>;
  /** What says how to turn a card over and move it. */
  hintId: string;
  onMove: (id: string, offset: KudosBoardOffset) => void;
  onOpen: (kudos: ReadKudos) => void;
  onTurn: (id: string) => void;
};

/**
 * One Kudos on the board: its card, leaning a little as it always does, over who gave it to whom. A
 * button the size of the card opens it large on a press, and turns it over on a double press, to
 * the day it was given. Where there is a mouse it also moves it, with the arrow keys too; on a phone
 * a card stays where it hangs, and a swipe passes through to the board. Memoised, with callbacks
 * that take its id: moving or turning a card redraws no other.
 */
export const KudosBoardCard = memo(function KudosBoardCard({
  item,
  place,
  position,
  isTurned,
  boardRef,
  hintId,
  onMove,
  onOpen,
  onTurn,
}: KudosBoardCardProps) {
  const cardRef = useRef<HTMLLIElement>(null);
  const drag = useKudosBoardDrag({
    cardRef,
    boardRef,
    offset: place ?? WHERE_IT_HANGS,
    onMove: (offset) => onMove(item.id, offset),
    onOpen: () => onOpen(item),
    onTurn: () => onTurn(item.id),
  });

  return (
    <li
      ref={cardRef}
      style={
        {
          translate: place ? `${place.x}px ${place.y}px` : undefined,
          zIndex: place?.order,
          // Its place in the line on the way back. A number and not a delay: a delay set here would hold every
          // move of a drag back too, however short, and the card would stay behind the pointer.
          '--kudos-board-order': place ? undefined : position,
        } as React.CSSProperties
      }
      className={styles.card}
    >
      <div
        className={cn('relative', styles.fit)}
        style={{ rotate: `${kudosTiltOf(item.id)}deg` }}
      >
        <KudosCardReadOnly
          message={item.message}
          tags={item.messageTags}
          drawing={item.drawing}
          date={kudosCardDate(item.givenAt)}
          side={isTurned ? 'back' : 'front'}
        />
        <button
          type="button"
          aria-label={`Kudos from ${item.giver.name ?? GIVER_WITH_NO_NAME}`}
          aria-describedby={hintId}
          {...drag}
          className={cn(
            'absolute inset-0 block pointer-fine:cursor-grab rounded-element pointer-fine:active:cursor-grabbing',
            styles.grip,
          )}
        />
      </div>
      <KudosBoardCaption item={item} />
    </li>
  );
});
