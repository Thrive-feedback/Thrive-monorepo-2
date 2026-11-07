import type { PersonalRequest } from '@/app/(signed-in)/(sidebar)/_lib/personal-item.type';
import { PERSONAL_ITEM_TILE } from '@/app/(signed-in)/(sidebar)/_lib/personal-items-layout.constant';
import {
  askedLine,
  newestAnswerOf,
  requestAudienceOf,
  tallyOf,
} from '@/app/(signed-in)/(sidebar)/_lib/request-card.util';
import { useReceivedShow } from '@/app/(signed-in)/(sidebar)/_lib/use-received-show';
import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import { TargetLink } from '@/components/molecules/target-link';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { kudosTiltOf } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { PostcardMiniature } from '@/components/organisms/postcard-miniature/postcard-miniature';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import { timeAgo } from '@/lib/time-ago.util';
import tileStyles from './personal-item-tile.module.css';
import { PersonalItemTilePending } from './personal-item-tile-pending';
import { RequestTally } from './request-card';

export type RequestTileProps = {
  request: PersonalRequest;
};

/**
 * A request the Member sent, as one box in Received's grid: how many answered among the faces of
 * everyone asked, when it was sent, and its card made small, showing its newest answer. Pressing it
 * opens that answer's postcard, where the others can be paged through. A request nobody has
 * answered has nothing to open, so it is a plain box, not a button.
 */
export function RequestTile({ request }: RequestTileProps) {
  const show = useReceivedShow();
  const newest = newestAnswerOf(request);
  const { Icon, label } = requestAudienceOf(request.visibility);
  const { answered, asked } = tallyOf(request);
  const card = (
    <span
      style={{ rotate: `${kudosTiltOf(request.id)}deg` }}
      className="flex justify-center p-2"
    >
      <PostcardMiniature card={newest?.card ?? request.card} />
    </span>
  );

  return (
    <article className={PERSONAL_ITEM_TILE}>
      <header className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <Text
            as="p"
            variant="subtitle-4"
            className="line-clamp-2 break-words"
          >
            {askedLine(request)}
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            Sent <TimeAgo dateTime={request.sentAt} />
          </Text>
        </div>
        <Icon
          aria-hidden="true"
          className="size-4 shrink-0 text-fg-secondary"
        />
        <span className="sr-only">{label}</span>
      </header>
      {newest ? (
        <TargetLink
          target={{
            href: ROUTES.receivedFeedback(newest.id, 'grid', show),
          }}
          className={cn(
            'block w-full font-normal after:absolute after:inset-0 after:rounded-page',
            tileStyles.press,
          )}
        >
          <span className="sr-only" suppressHydrationWarning>
            {`Your request, sent ${timeAgo(request.sentAt)}, ${answered} of ${asked} answered. Opens the newest answer's postcard.`}
          </span>
          {card}
          <PersonalItemTilePending />
        </TargetLink>
      ) : (
        <div aria-hidden="true">{card}</div>
      )}
      <Text as="p" variant="body-2" className="line-clamp-2 break-words">
        <FeedbackText text={request.message} tags={request.messageTags} />
      </Text>
      <RequestTally request={request} />
    </article>
  );
}
