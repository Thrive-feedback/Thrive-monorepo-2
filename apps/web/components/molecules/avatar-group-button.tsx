import { cva } from 'class-variance-authority';
import { PlusIcon } from 'lucide-react';
import type { AvatarProps } from '@/components/atoms/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { AvatarGroup } from '@/components/molecules/avatar-group';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { cn } from '@/lib/cn.util';

const names = new Intl.ListFormat('en', { type: 'conjunction' });

/** How many faces show before the rest become one "+N". */
const MAX_FACES = 4;

/** The dashed "+" at the end of the stack, the size of one face. */
const addCircle = cva(
  'flex shrink-0 items-center justify-center rounded-full border border-dashed transition-colors',
  {
    variants: {
      size: { sm: 'size-6', md: 'size-8', lg: 'size-10' },
      invalid: {
        true: 'border-status-error-border text-status-error-fg',
        false:
          'border-border-strong text-fg-secondary group-hover:border-action-primary group-hover:text-action-primary group-focus-visible:border-action-primary group-focus-visible:text-action-primary',
      },
    },
  },
);

const addIcon = cva('', {
  variants: { size: { sm: 'size-3.5', md: 'size-4', lg: 'size-4' } },
});

/** One person in the stack: who they are, and the name their face stands for. */
export type AvatarGroupPerson = {
  readonly id: string;
  readonly name: string;
  /** Their photo, or `null` to show their initials. */
  readonly photoUrl: string | null;
};

export type AvatarGroupButtonProps = Omit<
  React.ComponentPropsWithRef<'button'>,
  'children'
> & {
  /** The people chosen so far, in the order they stack. */
  people: readonly AvatarGroupPerson[];
  /** What pressing it does, such as "Choose who to ask". Heard before the names. */
  label: string;
  size?: NonNullable<AvatarProps['size']>;
  /** Nobody chosen where somebody must be: the "+" turns the error colour. */
  invalid?: boolean;
};

/**
 * The people chosen so far as an overlapping stack, ending in a dashed "+" the size of one face.
 * It is one button: pressing a face or the "+" does the same thing, usually open a dialog to
 * change who is chosen. With nobody chosen it is the "+" alone.
 *
 * Four faces show before the rest become one "+N", drawn exactly as `AvatarGroup` draws them. A
 * face is the person's photo, or their initials without one, and says the full name on hover;
 * the "+N" lists who it stands for. A screen reader hears the label and then every name, from
 * text kept for it alone.
 */
export function AvatarGroupButton({
  people,
  label,
  size = 'lg',
  invalid = false,
  className,
  ...rest
}: AvatarGroupButtonProps) {
  const hidden = people.slice(MAX_FACES);

  return (
    <button
      type="button"
      aria-invalid={invalid || undefined}
      className={cn(
        'group flex w-fit cursor-pointer items-center gap-3 rounded-full',
        className,
      )}
      {...rest}
    >
      <span className="sr-only">
        {people.length === 0
          ? label
          : `${label}. Chosen: ${names.format(people.map((person) => person.name))}`}
      </span>
      {people.length > 0 && (
        <AvatarGroup
          aria-hidden="true"
          max={MAX_FACES}
          size={size}
          moreTooltip={names.format(hidden.map((person) => person.name))}
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
              <TooltipContent>{person.name}</TooltipContent>
            </Tooltip>
          ))}
        </AvatarGroup>
      )}
      <span aria-hidden="true" className={addCircle({ size, invalid })}>
        <PlusIcon className={addIcon({ size })} />
      </span>
    </button>
  );
}
