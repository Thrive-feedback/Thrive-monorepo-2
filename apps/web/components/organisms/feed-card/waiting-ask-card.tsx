import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { TargetLink } from '@/components/molecules/target-link';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { PersonName } from '@/components/organisms/person-name';
import { cn } from '@/lib/cn.util';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { NO_NAME_STARTING_A_SENTENCE } from './feed-card-sentence.util';
import { FEED_CARD_SURFACE } from './feed-card-surface.constant';
import { PendingMiniPostcard } from './pending-mini-postcard';
import { noteLieOf, WaitingAskNote } from './waiting-ask-note';

export type WaitingAskCardProps = {
  ask: MyAsk;
  /** What pressing the small postcard does: it opens the postcard to answer on. */
  target: NavTarget;
};

/**
 * An Ask waiting for the person, on the ground of a card on Home: who asked, how long ago, and the
 * Request message cut at three lines, beside a large small postcard and a note pointing to it. It says
 * nothing about who else can read the answer.
 */
export function WaitingAskCard({ ask, target }: WaitingAskCardProps) {
  const name = ask.requesterName ?? NO_NAME_STARTING_A_SENTENCE;

  return (
    <article
      className={cn(FEED_CARD_SURFACE, 'lg:flex-row lg:items-center lg:gap-6')}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="flex items-start gap-3">
          <PhotoAvatar
            name={ask.requesterName ?? ''}
            photoUrl={ask.requesterPhotoUrl}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Text as="p" variant="subtitle-4" className="break-words">
              <PersonName name={name} inactive={ask.requesterInactive} />{' '}
              <span className="text-fg-secondary">
                requested feedback from you
              </span>
            </Text>
            <Text as="p" variant="body-3" tone="muted">
              <TimeAgo dateTime={ask.askedAt} />
            </Text>
          </div>
        </header>
        <Text
          as="p"
          variant="body-1"
          className="line-clamp-3 whitespace-pre-line break-words"
        >
          <FeedbackText text={ask.message} tags={ask.messageTags} />
        </Text>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <WaitingAskNote lie={noteLieOf(ask.askId)} />
        <TargetLink target={target} className="group/card-link block">
          <span className="sr-only">
            Answer in the postcard: {name} requested feedback from you
          </span>
          <PendingMiniPostcard kind="requested" date={ask.askedAt} size="lg" />
        </TargetLink>
      </div>
    </article>
  );
}
