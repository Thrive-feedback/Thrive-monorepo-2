import type { AvatarProps } from '@/components/atoms/avatar';
import { AvatarGroup } from './avatar-group';
import { PhotoAvatar } from './photo-avatar';

/** Past this many faces, the rest become one "+N", as in `AvatarGroupButton`. */
const MAX_FACES = 4;

export type PeopleStackProps = {
  /** Who it shows, in order: their photo, or their initials without one. */
  people: readonly {
    readonly name: string | null;
    readonly photoUrl: string | null;
  }[];
  size?: NonNullable<AvatarProps['size']>;
};

/**
 * Several people's faces as one overlapping stack — everyone a piece of Feedback is for — drawn
 * exactly as `AvatarGroup` draws them and as `AvatarGroupButton` shows who is chosen, so a stack
 * of faces looks the same wherever it is.
 *
 * Only ever shown beside the names it stands for, so it is hidden from screen readers rather
 * than read twice, and it answers no press.
 */
export function PeopleStack({ people, size = 'md' }: PeopleStackProps) {
  return (
    <AvatarGroup
      aria-hidden="true"
      max={MAX_FACES}
      size={size}
      className="shrink-0"
    >
      {people.map((person, index) => (
        <PhotoAvatar
          // A person's place in the stack is fixed once the Feedback is sent, and two people
          // can share a name or have none.
          // biome-ignore lint/suspicious/noArrayIndexKey: see above
          key={index}
          name={person.name ?? ''}
          photoUrl={person.photoUrl}
          size={size}
        />
      ))}
    </AvatarGroup>
  );
}
