import {
  listOfNames,
  NO_NAME_IN_A_SENTENCE,
  NO_NAME_STARTING_A_SENTENCE,
} from '@/components/organisms/feed-card/feed-card-sentence.util';
import type { HomeFeedPerson } from '@/lib/feedback/home-feed-item.type';
import type { PersonalItem } from './personal-item.type';
import type { PersonalItemsSide } from './personal-items-side.constant';

/** How many a tile names before the rest become one "+N": a box this narrow holds no more. */
const NAMED_ON_A_TILE = 2;

function firstNameOf({ name }: HomeFeedPerson) {
  return name?.split(' ')[0] ?? NO_NAME_STARTING_A_SENTENCE;
}

/** The other end of a piece: who wrote it in Received, who it was for in Given. */
export function otherPeopleOn(
  item: PersonalItem,
  side: PersonalItemsSide,
): readonly HomeFeedPerson[] {
  if (side === 'received') {
    return [item.giver];
  }
  return item.kind === 'KUDOS' ? item.recipients : item.receivers;
}

/** Several people on a tile, by first name: "Ann & Chai", or "Ann, Chai +1". */
export function tileNamesOf(people: readonly HomeFeedPerson[]) {
  const [first, second] = people.map(firstNameOf);
  const rest = people.length - NAMED_ON_A_TILE;
  return rest > 0 ? `${first}, ${second} +${rest}` : `${first} & ${second}`;
}

/** Everyone a tile is for, whole, for what a screen reader hears. Nobody is the whole Workspace. */
export function everyoneNamedIn(people: readonly HomeFeedPerson[]) {
  return people.length === 0
    ? 'the whole Workspace'
    : listOfNames(people.map(({ name }) => name ?? NO_NAME_IN_A_SENTENCE));
}
