import { Fragment } from 'react';
import { PersonName } from './person-name';

export type PersonNameListProps = {
  /** Everyone named, in order. */
  people: readonly {
    readonly name: string | null;
    readonly inactive: boolean;
    /** The signed-in person themself, named "you". */
    readonly isYou?: boolean;
  }[];
  /** What to call somebody who has not introduced themselves yet, such as "a teammate". */
  unnamed: string;
};

/** Between the names: commas, and "and" before the last. */
function separatorBefore(index: number, count: number) {
  return index === count - 1 ? ' and ' : ', ';
}

/**
 * Several people's names as one phrase inside a sentence — "Krit, Ann and Ben" — each as
 * `PersonName` shows it, in grey with "(inactive)" while they are Deactivated. The words between
 * them are muted, as "to" is in the sentence around them.
 */
export function PersonNameList({ people, unnamed }: PersonNameListProps) {
  return people.map((person, index) => (
    // A person's place in the list is fixed once the Feedback or Kudos is sent, and two people
    // can share a name or have none.
    // biome-ignore lint/suspicious/noArrayIndexKey: see above
    <Fragment key={index}>
      {index > 0 && (
        <span className="text-fg-secondary">
          {separatorBefore(index, people.length)}
        </span>
      )}
      <PersonName
        name={person.name ?? unnamed}
        inactive={person.inactive}
        isYou={person.isYou}
      />
    </Fragment>
  ));
}
