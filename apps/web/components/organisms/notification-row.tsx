import NextLink from 'next/link';
import { DropdownMenuItem } from '@/components/atoms/dropdown-menu';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { audienceForOthers } from '@/components/organisms/feed-card/feed-card-audience.util';
import { FEED_CARD_FILL } from '@/components/organisms/feed-card/feed-card-tone.constant';
import type { FeedCardTone } from '@/components/organisms/feed-card/feed-card-tone.type';
import { cn } from '@/lib/cn.util';
import type {
  BellNotification,
  NotificationType,
} from '@/lib/notifications/notification.type';
import { notificationLine } from '@/lib/notifications/notification-copy.constant';
import { timeAgo } from '@/lib/time-ago.util';

/**
 * The kind of card each line leads to, as its colour: the cool one for anything asked or answered,
 * the brand's for Feedback written to the person or shared with them, which is only ever Feedback
 * given unasked. The unread dot takes it, so a dot and the card it opens match.
 */
const NOTIFICATION_TONES: Readonly<Record<NotificationType, FeedCardTone>> = {
  ASK_RECEIVED: 'tertiary',
  ASK_ANSWERED: 'tertiary',
  FEEDBACK_RECEIVED: 'primary',
  FEEDBACK_SHARED: 'primary',
};

/**
 * Who can read what a line leads to, said from the side of the person told, who is not the one
 * "me" Only me names. Nothing for a line written before that was recorded.
 */
function bellAudienceOf(audience: BellNotification['audience']) {
  return audience === null ? null : audienceForOthers(audience);
}

export type NotificationRowProps = {
  notification: BellNotification;
  /** Pressing the line: it is about to open what it points at, and counts as read. */
  onOpen: (notification: BellNotification) => void;
};

/**
 * One line in the bell: whether it is still unread, the face of who did it, what happened, how
 * long ago, and at the end who can read what it leads to.
 *
 * It is a link rather than a button, so it opens in a new tab on a middle click and reads as a
 * link to a screen reader. Unread is said in words as well as drawn as a dot, because a colour
 * says nothing to somebody who cannot see it. The face is hidden from screen readers, because the
 * sentence already names the person.
 */
export function NotificationRow({
  notification,
  onOpen,
}: NotificationRowProps) {
  const { actor, sentence, destination } = notificationLine(notification);
  const audience = bellAudienceOf(notification.audience);

  return (
    <DropdownMenuItem asChild onSelect={() => onOpen(notification)}>
      <NextLink href={destination} className="items-start gap-2">
        <span
          aria-hidden="true"
          className={cn(
            'mt-2 size-2 shrink-0 rounded-full',
            notification.isRead
              ? 'bg-transparent'
              : FEED_CARD_FILL[NOTIFICATION_TONES[notification.type]],
          )}
        />
        <PhotoAvatar
          name={actor}
          photoUrl={notification.actorPhotoUrl}
          size="sm"
          className="shrink-0"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
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
        {audience && (
          <>
            <audience.Icon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-fg-secondary"
            />
            <span className="sr-only">Visible to {audience.label}</span>
          </>
        )}
        {!notification.isRead && <span className="sr-only">Unread</span>}
      </NextLink>
    </DropdownMenuItem>
  );
}

/**
 * One line's shape while it is being fetched, at the height the real row will be — so the panel
 * fills rather than resizing as the lines arrive. A dot, a face, a sentence and a time, exactly as
 * {@link NotificationRow} draws them, and the padding of the menu item it stands in for.
 */
export function NotificationRowSkeleton() {
  return (
    <div className="flex items-start gap-2 px-2 py-2">
      <span aria-hidden="true" className="mt-2 size-2 shrink-0" />
      <Skeleton shape="circle" className="size-6 shrink-0" />
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <Skeleton className="w-3/4 text-body-2" />
        <Skeleton className="w-1/4 text-caption" />
      </span>
    </div>
  );
}
