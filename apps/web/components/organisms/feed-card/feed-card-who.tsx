import { Text } from '@/components/atoms/text';
import { AvatarName } from '@/components/molecules/avatar-name';
import { PeopleDialogButton } from '@/components/organisms/people-dialog-button';
import { PersonName } from '@/components/organisms/person-name';
import type { HomeFeedPerson } from '@/lib/feedback/home-feed-item.type';
import {
  feedCardGiver,
  NO_NAME_IN_A_SENTENCE,
  readerFirst,
} from './feed-card-sentence.util';

type ReceiversProps = {
  receivers: readonly HomeFeedPerson[];
  /** One sentence over the list of several, saying how they are connected. */
  peopleDescription: string;
  readerAccountId: string;
};

/**
 * Who a card is for: one person's face and name, the reader as "you", or several people as a small
 * stack, the reader first, which lists them on a press. A Kudos can name nobody, and is then for the
 * whole Workspace (ADR 0074).
 */
function Receivers({
  receivers,
  peopleDescription,
  readerAccountId,
}: ReceiversProps) {
  const [onlyReceiver] = receivers;

  if (!onlyReceiver) {
    return <span>the whole Workspace</span>;
  }
  if (receivers.length === 1) {
    return (
      <AvatarName
        name={onlyReceiver.name ?? ''}
        photoUrl={onlyReceiver.photoUrl}
        size="sm"
      >
        {onlyReceiver.accountId === readerAccountId ? (
          'you'
        ) : (
          <PersonName
            name={onlyReceiver.name ?? NO_NAME_IN_A_SENTENCE}
            inactive={onlyReceiver.inactive}
          />
        )}
      </AvatarName>
    );
  }
  return (
    <span className="inline-flex">
      <PeopleDialogButton
        people={readerFirst(receivers, readerAccountId)}
        unnamed={NO_NAME_IN_A_SENTENCE}
        description={peopleDescription}
      />
    </span>
  );
}

export type FeedCardWhoProps = {
  giver: HomeFeedPerson;
  receivers: readonly HomeFeedPerson[];
  /** What the Giver did, between their name and "to". */
  verb: string;
  /** One sentence over the list of several, saying how they are connected. */
  peopleDescription: string;
  /** Who is reading, so the line can say "You" where it names them. */
  readerAccountId: string;
};

/**
 * A card's opening line on Home, never anonymous (`ADR-0022` in the brain): who did what, to whom.
 * Each person in it wears the same small face beside their name.
 */
export function FeedCardWho({
  giver,
  receivers,
  verb,
  peopleDescription,
  readerAccountId,
}: FeedCardWhoProps) {
  return (
    <Text
      as="div"
      variant="subtitle-4"
      className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 break-words"
    >
      <AvatarName name={giver.name ?? ''} photoUrl={giver.photoUrl} size="sm">
        {giver.accountId === readerAccountId ? (
          'You'
        ) : (
          <PersonName
            name={feedCardGiver(giver, readerAccountId)}
            inactive={giver.inactive}
          />
        )}
      </AvatarName>
      <span className="text-fg-secondary">{verb}</span>
      <span className="text-action-secondary-hover">to</span>
      <Receivers
        receivers={receivers}
        peopleDescription={peopleDescription}
        readerAccountId={readerAccountId}
      />
    </Text>
  );
}
