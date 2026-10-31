import { memo } from 'react';
import { AvatarName } from '@/components/molecules/avatar-name';
import {
  type GroupPerson,
  PeopleDialogButton,
} from '@/components/organisms/people-dialog-button';
import { PersonName } from '@/components/organisms/person-name';
import { cn } from '@/lib/cn.util';
import type { PostcardWriter } from './postcard-draft.type';

const UNNAMED_RECEIVER = 'A teammate';

type PostcardPersonProps = {
  name: string;
  photoUrl: string | null;
  inactive?: boolean;
};

/** A face and a name, the name in grey with "(inactive)" while they are Deactivated. */
function PostcardPerson({ name, photoUrl, inactive }: PostcardPersonProps) {
  return (
    <AvatarName name={name} photoUrl={photoUrl}>
      {inactive ? (
        <span className="text-subtitle-4">
          <PersonName name={name} inactive />
        </span>
      ) : undefined}
    </AvatarName>
  );
}

export type PostcardFromProps = {
  writer: PostcardWriter;
};

/** "From", a face and a name: who wrote the card or the Ask it heads. */
export const PostcardFrom = memo(function PostcardFrom({
  writer,
}: PostcardFromProps) {
  return (
    <div className="flex items-center gap-2 text-body-2 text-fg-secondary">
      From
      <PostcardPerson
        name={writer.name}
        photoUrl={writer.photoUrl}
        inactive={writer.inactive}
      />
    </div>
  );
});

export type PostcardToProps = {
  /** The one person the line is addressed to. */
  person: PostcardWriter;
};

/** "To", a face and a name: who an Ask was addressed to, and so who answers it. */
export const PostcardTo = memo(function PostcardTo({
  person,
}: PostcardToProps) {
  return (
    <div className="flex items-center gap-2 text-body-2 text-fg-secondary">
      To
      <PostcardPerson
        name={person.name}
        photoUrl={person.photoUrl}
        inactive={person.inactive}
      />
    </div>
  );
});

export type PostcardAddressReadOnlyProps = {
  writer: PostcardWriter;
  /** Who it went to: at least one. */
  receivers: readonly [GroupPerson, ...GroupPerson[]];
  /** How far the line keeps clear of the stamp. */
  className?: string;
};

/**
 * The top line of a postcard that has been sent: who it is from and who it went to. Several
 * Receivers fold into one stack of faces, as they do while writing, which names them when pressed.
 */
export const PostcardAddressReadOnly = memo(function PostcardAddressReadOnly({
  writer,
  receivers,
  className,
}: PostcardAddressReadOnlyProps) {
  const [onlyReceiver, ...others] = receivers;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-6 gap-y-2', className)}
    >
      <PostcardFrom writer={writer} />
      <div className="flex items-center gap-2 text-body-2 text-fg-secondary">
        To
        {others.length === 0 ? (
          <PostcardPerson
            name={onlyReceiver.name ?? UNNAMED_RECEIVER}
            photoUrl={onlyReceiver.photoUrl}
            inactive={onlyReceiver.inactive}
          />
        ) : (
          <PeopleDialogButton
            people={receivers}
            unnamed={UNNAMED_RECEIVER}
            description={`${writer.name} gave this Feedback to all of them.`}
          />
        )}
      </div>
    </div>
  );
});
