import { cva } from 'class-variance-authority';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { cn } from '@/lib/cn.util';
import type { FeedbackPerson } from '@/lib/feedback/feedback-person.util';
import { PersonName } from './person-name';

/** The face's size sets the room beside it: tight in a sentence, wider in a list. */
const chip = cva('inline-flex min-w-0 max-w-full items-center', {
  variants: {
    size: {
      sm: 'gap-1.5',
      md: 'gap-3',
      lg: 'gap-3',
    },
  },
  defaultVariants: { size: 'sm' },
});

export type PersonChipProps = {
  person: FeedbackPerson;
  /** What to call somebody who has not introduced themselves yet, such as "a teammate". */
  unnamed: string;
  /** Where the face's initials come from while they have no name, such as their email. */
  faceName?: string;
  /** A second line under the name, such as their email, kept clear of the face. */
  detail?: React.ReactNode;
  /** The name's own id, for a control that is labelled by the name alone. */
  nameId?: string;
  /** The face's size: `sm` inside a sentence, `md` in a list of people, `lg` in a picker. */
  size?: 'sm' | 'md' | 'lg';
  /** Opens a sentence, so "you" is written "You". */
  sentenceStart?: boolean;
  className?: string;
};

/**
 * Somebody as Thrive shows them anywhere: their face beside their name. The face is their Google
 * photo or their initials; the name is grey with "(inactive)" while they are Deactivated, and
 * "you" when it is the person reading. Never anonymous (`ADR-0022` in the brain).
 */
export function PersonChip({
  person,
  unnamed,
  faceName,
  detail,
  nameId,
  size = 'sm',
  sentenceStart = false,
  className,
}: PersonChipProps) {
  const name = (
    <span id={nameId} className="min-w-0 break-words">
      <PersonName
        name={person.name ?? unnamed}
        inactive={person.inactive}
        isYou={person.isYou}
        sentenceStart={sentenceStart}
      />
    </span>
  );

  return (
    <span className={cn(chip({ size }), className)}>
      <PhotoAvatar
        name={person.name ?? faceName ?? ''}
        photoUrl={person.photoUrl}
        size={size}
      />
      {detail === undefined ? (
        name
      ) : (
        <span className="flex min-w-0 flex-col">
          {name}
          {detail}
        </span>
      )}
    </span>
  );
}
