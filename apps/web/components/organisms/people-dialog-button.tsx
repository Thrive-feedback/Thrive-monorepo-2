import { AvatarGroup } from '@/components/molecules/avatar-group';

/** Past this many faces, the rest become one "+N", as everywhere a stack of faces is drawn. */
const MAX_FACES = 4;

/** Somebody the group stands for, as a card shows them. */
export type GroupPerson = {
  /** `null` while they have not introduced themselves. */
  readonly name: string | null;
  readonly photoUrl: string | null;
  readonly inactive: boolean;
};

export type PeopleDialogButtonProps = {
  /** Everyone it stands for, in order — two or more. */
  people: readonly GroupPerson[];
  /** What to call somebody who has not introduced themselves yet, such as "A teammate". */
  unnamed: string;
  /** One sentence under the dialog's title, saying how these people are connected. */
  description: string;
};

/**
 * Several people on a card as one small stack of faces: a hover names each, and a press lists every
 * one of them, face and name. It stands in a sentence where writing every name would crowd the
 * line, so a screen reader hears the names on the button itself. Somebody Deactivated reads in grey
 * with "(inactive)", and somebody with no name yet by the word the card gives them.
 */
export function PeopleDialogButton({
  people,
  unnamed,
  description,
}: PeopleDialogButtonProps) {
  return (
    <AvatarGroup
      people={people.map((person, index) => {
        const name = person.name ?? unnamed;
        return {
          // A person's place in the group is fixed once it is sent, and two people can share a
          // name or have none.
          id: String(index),
          name: person.name ?? '',
          photoUrl: person.photoUrl,
          label: person.inactive ? `${name} (inactive)` : name,
          isMuted: person.inactive,
        };
      })}
      max={MAX_FACES}
      size="sm"
      listTitle={`For ${people.length} people`}
      listDescription={description}
      listLabel="Show who it is for"
    />
  );
}
