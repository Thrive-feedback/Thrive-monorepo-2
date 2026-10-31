'use client';

import NextLink from 'next/link';
import { DropdownMenuItem } from '@/components/atoms/dropdown-menu';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import type { BellNotification } from '@/lib/notifications/notification.type';
import { notificationLine } from '@/lib/notifications/notification-copy.constant';
import { timeAgo } from '@/lib/time-ago.util';

export type NotificationRowProps = {
  notification: BellNotification;
  /** Pressing the line: it is about to open what it points at, and counts as read. */
  onOpen: (notification: BellNotification) => void;
};

/**
 * One line in the bell: what happened, how long ago, and whether it is still unread.
 *
 * It is a link rather than a button, so it opens in a new tab on a middle click and reads as a
 * link to a screen reader. Unread is said in words as well as drawn as a dot, because a colour
 * says nothing to somebody who cannot see it.
 */
export function NotificationRow({
  notification,
  onOpen,
}: NotificationRowProps) {
  const { sentence, destination } = notificationLine(notification);

  return (
    <DropdownMenuItem asChild onSelect={() => onOpen(notification)}>
      <NextLink href={destination} className="items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'mt-1.5 size-2 shrink-0 rounded-full',
            notification.isRead ? 'bg-transparent' : 'bg-action-primary',
          )}
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <Text
            as="span"
            variant="body-2"
            className={cn(notification.isRead ? undefined : 'font-semibold')}
          >
            {sentence}
          </Text>
          <Text as="span" variant="caption" tone="muted">
            {timeAgo(notification.createdAt)}
          </Text>
        </span>
        {!notification.isRead && <span className="sr-only">Unread</span>}
      </NextLink>
    </DropdownMenuItem>
  );
}

/**
 * One line's shape while it is being fetched, at the height the real row will be — so the panel
 * fills rather than resizing as the lines arrive. A dot, a sentence and a time, exactly as
 * {@link NotificationRow} draws them, and the padding of the menu item it stands in for.
 */
export function NotificationRowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-2 py-2">
      <span aria-hidden="true" className="mt-1.5 size-2 shrink-0" />
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <Skeleton className="w-3/4 text-body-2" />
        <Skeleton className="w-1/4 text-caption" />
      </span>
    </div>
  );
}
