import { Children } from 'react';
import {
  Avatar,
  AvatarFallback,
  type AvatarProps,
} from '@/components/atoms/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';
import { Text } from '@/components/atoms/text';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { cn } from '@/lib/cn.util';
import { AvatarName } from './avatar-name';
import { PhotoAvatar } from './photo-avatar';

const names = new Intl.ListFormat('en', { type: 'conjunction' });

/** One person in a stack: who they are, and the name their face stands for. */
export type AvatarGroupPerson = {
  readonly id: string;
  /** Who they are: their initials stand in for a photo. */
  readonly name: string;
  /** Their photo, or `null` to show their initials. */
  readonly photoUrl: string | null;
  /** What to call them where it is more than their name, such as "Mali (inactive)". */
  readonly label?: string;
  /** They read in grey in the list, as somebody no longer active does. */
  readonly isMuted?: boolean;
  /** What the list says about them at the end of their row, such as where they stand. */
  readonly trailing?: React.ReactNode;
};

/** What a stack calls somebody, in words. */
function labelOf({ label, name }: AvatarGroupPerson) {
  return label ?? name;
}

export type AvatarGroupProps = React.ComponentPropsWithRef<'div'> & {
  /** How many avatars to show before the rest become one "+N" bubble. Shows all when unset. */
  max?: number;
  /** The "+N" bubble's size. Match the size of the avatars you pass in. */
  size?: AvatarProps['size'];
  /** What the "+N" bubble says on hover, such as the names it stands for. */
  moreTooltip?: React.ReactNode;
  /**
   * Who the faces are. Pass these instead of `children` and the group draws them itself: each face
   * says its name on hover, and pressing the group lists everyone.
   */
  people?: readonly AvatarGroupPerson[];
  /** The list's title. Says how many people it holds when unset. */
  listTitle?: string;
  /** One sentence under the list's title, saying how these people are connected. */
  listDescription?: string;
  /** What pressing the group does, heard after the names, such as "Show who it is for". */
  listLabel?: string;
};

/**
 * People as one overlapping stack: the reviewers of a request, the members of a team.
 *
 *   <AvatarGroup aria-label="Reviewers" max={3}>
 *     <Avatar><AvatarImage src={…} alt="Pepper Potts" /><AvatarFallback>PP</AvatarFallback></Avatar>
 *     …
 *   </AvatarGroup>
 *
 * Or given `people`, the same stack that names itself: a hover says who each face is, and a press,
 * click, tap or keyboard, opens the list of everyone, which a hover alone could not do on a phone.
 *
 *   <AvatarGroup people={reviewers} max={4} size="sm" listLabel="Show the reviewers" />
 *
 * A group named by its `aria-label`, so a screen reader hears the set before each name. Each
 * avatar wears a ring in the page colour, which keeps overlapping faces apart. The ring goes on
 * every direct child, not only on an element marked as an avatar, so a face wrapped as a tooltip
 * trigger, which takes the trigger's marks, is ringed the same. The bubble is
 * announced as "N more", not as a bare "+N".
 *
 * `max` counts direct children, so pass the avatars themselves — an array from a `map` — not
 * one component that renders them all.
 */
export function AvatarGroup({
  max,
  size = 'md',
  moreTooltip,
  people,
  listTitle,
  listDescription,
  listLabel = 'Show everyone',
  className,
  children,
  ...rest
}: AvatarGroupProps) {
  if (people) {
    return (
      <PeopleList
        people={people}
        max={max}
        size={size}
        title={listTitle}
        description={listDescription}
        label={listLabel}
        className={className}
      />
    );
  }

  const avatars = Children.toArray(children);
  const shown = max === undefined ? avatars : avatars.slice(0, max);
  const hiddenCount = avatars.length - shown.length;

  return (
    // biome-ignore lint/a11y/useSemanticElements: `<fieldset>` is the form element for grouped controls; a stack of faces is a plain named group.
    <div
      data-slot="avatar-group"
      role="group"
      className={cn('flex -space-x-2 *:ring-2 *:ring-surface-base', className)}
      {...rest}
    >
      {shown}
      {hiddenCount > 0 &&
        (moreTooltip === undefined ? (
          <MoreBubble size={size} hiddenCount={hiddenCount} />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <MoreBubble size={size} hiddenCount={hiddenCount} />
            </TooltipTrigger>
            <TooltipContent>{moreTooltip}</TooltipContent>
          </Tooltip>
        ))}
    </div>
  );
}

type MoreBubbleProps = AvatarProps & { hiddenCount: number };

/** The "+N" that stands for everyone past `max`, announced as "N more". */
function MoreBubble({ hiddenCount, ...rest }: MoreBubbleProps) {
  return (
    <Avatar role="img" aria-label={`${hiddenCount} more`} {...rest}>
      <AvatarFallback
        aria-hidden="true"
        className="bg-surface-subtle text-fg-secondary"
      >
        +{hiddenCount}
      </AvatarFallback>
    </Avatar>
  );
}

type PeopleListProps = {
  people: readonly AvatarGroupPerson[];
  max?: number;
  size: AvatarProps['size'];
  title?: string;
  description?: string;
  label: string;
  className?: string;
};

/** The stack as a button naming each face on hover, and the dialog it opens. */
function PeopleList({
  people,
  max,
  size,
  title,
  description,
  label,
  className,
}: PeopleListProps) {
  const hidden = max === undefined ? [] : people.slice(max);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            '-m-0.5 inline-flex w-fit cursor-pointer rounded-full p-0.5 transition-colors hover:bg-action-neutral-surface-hover',
            className,
          )}
        >
          {/* Overlapped less than the default: at the small size the next face would cover a
              face's second initial. */}
          <AvatarGroup
            aria-hidden="true"
            max={max}
            size={size}
            moreTooltip={names.format(hidden.map(labelOf))}
            className={cn(size === 'sm' && '-space-x-0.5')}
          >
            {people.map((person) => (
              <Tooltip key={person.id}>
                <TooltipTrigger asChild>
                  <PhotoAvatar
                    name={person.name}
                    photoUrl={person.photoUrl}
                    size={size}
                  />
                </TooltipTrigger>
                <TooltipContent>{labelOf(person)}</TooltipContent>
              </Tooltip>
            ))}
          </AvatarGroup>
          <span className="sr-only">
            {`${names.format(people.map(labelOf))}. ${label}`}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? `${people.length} people`}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ul className="flex flex-col gap-3">
          {people.map((person) => (
            <li key={person.id} className="flex items-center gap-3">
              <AvatarName
                name={person.name}
                photoUrl={person.photoUrl}
                className="flex flex-1"
              >
                <Text
                  as="span"
                  variant="subtitle-4"
                  className={cn(person.isMuted && 'text-fg-secondary')}
                >
                  {labelOf(person)}
                </Text>
              </AvatarName>
              {person.trailing}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
