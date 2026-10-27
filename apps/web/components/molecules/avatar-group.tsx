import { Children } from 'react';
import {
  Avatar,
  AvatarFallback,
  type AvatarProps,
} from '@/components/atoms/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { cn } from '@/lib/cn.util';

export type AvatarGroupProps = React.ComponentPropsWithRef<'div'> & {
  /** How many avatars to show before the rest become one "+N" bubble. Shows all when unset. */
  max?: number;
  /** The "+N" bubble's size. Match the size of the avatars you pass in. */
  size?: AvatarProps['size'];
  /** What the "+N" bubble says on hover, such as the names it stands for. */
  moreTooltip?: React.ReactNode;
};

/**
 * People as one overlapping stack: the reviewers of a request, the members of a team.
 *
 *   <AvatarGroup aria-label="Reviewers" max={3} size="md">
 *     <Avatar size="md"><AvatarImage src={…} alt="Pepper Potts" /><AvatarFallback>PP</AvatarFallback></Avatar>
 *     …
 *   </AvatarGroup>
 *
 * A group named by its `aria-label`, so a screen reader hears the set before each name. Each
 * avatar wears a ring in the page colour, which keeps overlapping faces apart. The bubble is
 * announced as "N more", not as a bare "+N".
 *
 * `max` counts direct children, so pass the avatars themselves — an array from a `map` — not
 * one component that renders them all.
 */
export function AvatarGroup({
  max,
  size = 'lg',
  moreTooltip,
  className,
  children,
  ...rest
}: AvatarGroupProps) {
  const avatars = Children.toArray(children);
  const shown = max === undefined ? avatars : avatars.slice(0, max);
  const hiddenCount = avatars.length - shown.length;

  return (
    // biome-ignore lint/a11y/useSemanticElements: `<fieldset>` is the form element for grouped controls; a stack of faces is a plain named group.
    <div
      data-slot="avatar-group"
      role="group"
      className={cn(
        'flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-surface-base',
        className,
      )}
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
