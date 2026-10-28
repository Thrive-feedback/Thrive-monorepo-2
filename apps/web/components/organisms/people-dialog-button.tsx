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
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { cn } from '@/lib/cn.util';
import {
  ASK_STATUS_NAMES,
  type AskStatus,
} from '@/lib/feedback/ask-status.constant';
import type { FeedbackPerson } from '@/lib/feedback/feedback-person.util';
import { PersonChip } from './person-chip';

/** Past this many faces, the rest become one "+N", as everywhere a stack of faces is drawn. */
const MAX_FACES = 4;

const names = new Intl.ListFormat('en', { type: 'conjunction' });

/**
 * The ring around a face, when the group says where each person's Ask stands. Its line repeats
 * the colour for anyone who cannot tell them apart: solid once answered, dashed while pending,
 * and the face faded once it expired — finished rather than failed, so grey, not red.
 */
const RING: Readonly<Record<AskStatus, string>> = {
  ANSWERED: 'outline-solid outline-status-success-border',
  PENDING: 'outline-dashed outline-status-warning-border',
  EXPIRED: 'outline-solid outline-border-default opacity-60',
};

/** Somebody the group stands for, and where their Ask stands when the group is of people asked. */
export type GroupPerson = FeedbackPerson & {
  readonly status?: AskStatus;
};

export type PeopleDialogButtonProps = {
  /** Everyone it stands for, in order — two or more, or any number when each has a status. */
  people: readonly GroupPerson[];
  /** What to call somebody who has not introduced themselves yet, such as "A teammate". */
  unnamed: string;
  /** One sentence under the dialog's title, saying how these people are connected. */
  description: string;
  /** The dialog's title, when "For N people" would not be true, such as "Also for 3 people". */
  title?: string;
  /** What pressing it does, said after the names to a screen reader. */
  action?: string;
};

/** A person as a screen reader hears them in the group: their name, and their status if any. */
function spokenName(person: GroupPerson, unnamed: string) {
  if (person.isYou) {
    return 'you';
  }
  const name = person.name ?? unnamed;
  const named = person.inactive ? `${name} (inactive)` : name;
  return person.status
    ? `${named}, ${ASK_STATUS_NAMES[person.status].toLowerCase()}`
    : named;
}

/**
 * Several people as one stack of faces that opens a dialog listing every one of them, face and
 * name. It stands in a sentence where writing every name would crowd the line, so a screen
 * reader hears the names on the button itself; pressing it — a click, a tap or the keyboard —
 * shows them to everyone else. A click and a tap behave the same, which a hover could not.
 *
 * When each person carries where their Ask stands, the faces sit apart, each ringed by it, and
 * the dialog says it in words beside the name, so nothing is told by colour alone.
 */
export function PeopleDialogButton({
  people,
  unnamed,
  description,
  title = `For ${people.length} people`,
  action = 'Show who it is for',
}: PeopleDialogButtonProps) {
  const withStatus = people.some((person) => person.status);
  const spoken = withStatus
    ? people.map((person) => spokenName(person, unnamed)).join('; ')
    : names.format(people.map((person) => spokenName(person, unnamed)));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex cursor-pointer rounded-full transition-colors hover:bg-action-neutral-surface-hover',
            withStatus ? '-m-1 p-1' : '-m-0.5 p-0.5',
          )}
        >
          {/* Overlapped less than the default: at this size the next face would cover a face's
              second initial. Ringed faces sit apart, so each ring reads whole. */}
          <AvatarGroup
            aria-hidden="true"
            max={MAX_FACES}
            size="sm"
            className={withStatus ? 'space-x-1.5 *:ring-0' : '-space-x-1'}
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
                className={
                  person.status &&
                  cn('outline-2 outline-offset-2', RING[person.status])
                }
              />
            ))}
          </AvatarGroup>
          <span className="sr-only">{`${spoken}. ${action}`}</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-3">
          {people.map((person, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: as for the faces above
            <li key={index} className="flex min-w-0 items-center gap-3">
              <Text as="span" variant="subtitle-4" className="min-w-0 flex-1">
                <PersonChip
                  person={person}
                  unnamed={unnamed}
                  size="md"
                  sentenceStart
                />
              </Text>
              {person.status && (
                <Text
                  as="span"
                  variant="body-3"
                  tone="muted"
                  className="shrink-0"
                >
                  {ASK_STATUS_NAMES[person.status]}
                </Text>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
