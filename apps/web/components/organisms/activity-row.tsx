import { ChevronRightIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { TargetLink } from '@/components/molecules/target-link';
import type { NavTarget } from '@/lib/navigation/nav-target.type';

export type ActivityRowProps = {
  /** What stands at the start of the row: an `ActivityAvatar`, or a mark for the person's own. */
  lead: React.ReactNode;
  /** Who did what to whom, as one line. */
  title: React.ReactNode;
  /** The day, and how it came about, muted under the title. */
  meta: React.ReactNode;
  /** What was written, the row's main text. */
  message: React.ReactNode;
  /** Where the row leads. The message is the link, and the whole row answers a press. */
  target?: NavTarget;
  /** What following the row does, said at its end beside the chevron: "Answer". */
  actionLabel?: string;
  /** Anything under the message. */
  footer?: React.ReactNode;
};

/**
 * One row of My Activity, shaped as a card on the feed is — who and whom with the day under it,
 * then what was written across the row's full width — so every list on Home reads alike. A row
 * that leads somewhere makes its message the link and stretches it over the row, and says at its
 * end what following it does.
 */
export function ActivityRow({
  lead,
  title,
  meta,
  message,
  target,
  actionLabel,
  footer,
}: ActivityRowProps) {
  return (
    <article className="relative flex flex-col gap-3 py-5">
      <header className="flex items-center gap-3">
        {lead}
        <div className="flex min-w-0 flex-1 flex-col">
          <Text as="p" variant="subtitle-4" className="break-words">
            {title}
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            {meta}
          </Text>
        </div>
        {target && (
          // The message is the link a screen reader follows; this only says it for the eye.
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center gap-0.5 text-button-sm text-fg-accent"
          >
            {actionLabel}
            <ChevronRightIcon className="size-4" />
          </span>
        )}
      </header>
      <Text as="p" variant="body-1" className="whitespace-pre-wrap break-words">
        {target ? (
          <TargetLink
            target={target}
            className="font-normal text-fg-primary after:absolute after:inset-0"
          >
            {message}
          </TargetLink>
        ) : (
          message
        )}
      </Text>
      {footer}
    </article>
  );
}

/** Somebody's initials in a circle, as a feed card shows the Giver. */
export function ActivityAvatar({ initials }: { initials: string }) {
  return (
    <Avatar size="md" aria-hidden="true">
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

/** An `ActivityRow` still loading, line for line. */
export function ActivityRowSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-5">
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" className="size-8" />
        <div className="flex min-w-0 flex-1 flex-col">
          <Skeleton className="w-1/2 text-subtitle-4" />
          <Skeleton className="w-1/4 text-body-3" />
        </div>
      </div>
      <Skeleton className="w-4/5 text-body-1" />
    </div>
  );
}
