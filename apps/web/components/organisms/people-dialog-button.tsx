'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';
import { Text } from '@/components/atoms/text';
import { AvatarGroup } from '@/components/molecules/avatar-group';
import { AvatarName } from '@/components/molecules/avatar-name';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { PersonName } from './person-name';

/** Past this many faces, the rest become one "+N", as everywhere a stack of faces is drawn. */
const MAX_FACES = 4;

const names = new Intl.ListFormat('en', { type: 'conjunction' });

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
 * Several people as one stack of faces that opens a dialog listing every one of them, face and
 * name. It stands in a sentence where writing every name would crowd the line, so a screen
 * reader hears the names on the button itself; pressing it — a click, a tap or the keyboard —
 * shows them to everyone else. A click and a tap behave the same, which a hover could not.
 */
export function PeopleDialogButton({
  people,
  unnamed,
  description,
}: PeopleDialogButtonProps) {
  const spoken = names.format(
    people.map((person) => {
      const name = person.name ?? unnamed;
      return person.inactive ? `${name} (inactive)` : name;
    }),
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="-m-0.5 inline-flex cursor-pointer rounded-full p-0.5 transition-colors hover:bg-action-neutral-surface-hover"
        >
          {/* Overlapped less than the default: at this size the next face would cover a face's
              second initial. */}
          <AvatarGroup
            aria-hidden="true"
            max={MAX_FACES}
            size="sm"
            className="-space-x-1"
          >
            {people.map((person, index) => (
              <PhotoAvatar
                // A person's place in the group is fixed once it is sent, and two people can
                // share a name or have none.
                // biome-ignore lint/suspicious/noArrayIndexKey: see above
                key={index}
                name={person.name ?? ''}
                photoUrl={person.photoUrl}
                size="sm"
              />
            ))}
          </AvatarGroup>
          <span className="sr-only">{`${spoken}. Show who it is for`}</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`For ${people.length} people`}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-3">
          {people.map((person, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: as for the faces above
            <li key={index}>
              <AvatarName
                name={person.name ?? ''}
                photoUrl={person.photoUrl}
                className="flex"
              >
                <Text as="span" variant="subtitle-4">
                  <PersonName
                    name={person.name ?? unnamed}
                    inactive={person.inactive}
                  />
                </Text>
              </AvatarName>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
