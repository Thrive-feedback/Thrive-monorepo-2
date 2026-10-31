import type {
  HomeFeedItem,
  HomeFeedPerson,
} from '@/lib/feedback/home-feed-item.type';

/** What a card calls somebody who has not introduced themselves yet. */
const GIVER_WITH_NO_NAME = 'A teammate';
const RECEIVER_WITH_NO_NAME = 'a teammate';

const names = new Intl.ListFormat('en-GB', {
  style: 'long',
  type: 'conjunction',
});

/** What a card calls its Giver: the reader as "You". */
export function feedCardGiver(
  giver: HomeFeedPerson,
  readerAccountId: string,
): string {
  return giver.accountId === readerAccountId
    ? 'You'
    : (giver.name ?? GIVER_WITH_NO_NAME);
}

/** Everyone a piece is for, the reader first and the rest in the order the Giver chose them. */
export function readerFirst(
  receivers: readonly HomeFeedPerson[],
  readerAccountId: string,
): readonly HomeFeedPerson[] {
  return [
    ...receivers.filter((receiver) => receiver.accountId === readerAccountId),
    ...receivers.filter((receiver) => receiver.accountId !== readerAccountId),
  ];
}

/** The header as one line of words, which is what a card is called for a screen reader. */
export function feedCardSentence(
  item: Pick<HomeFeedItem, 'giver' | 'receivers'>,
  readerAccountId: string,
): string {
  const receivers = readerFirst(item.receivers, readerAccountId).map(
    (receiver) =>
      receiver.accountId === readerAccountId
        ? 'you'
        : (receiver.name ?? RECEIVER_WITH_NO_NAME),
  );
  return `${feedCardGiver(item.giver, readerAccountId)} gave feedback to ${names.format(receivers)}`;
}
