import { GlobeIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { CardStamp } from '@/components/molecules/card-stamp';
import { TargetLink } from '@/components/molecules/target-link';
import type { FeedbackPerson } from '@/lib/feedback/feedback-person.util';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { FeedbackText } from './feedback-text';
import { PersonChip } from './person-chip';

/** What the card calls somebody who has not introduced themselves yet. */
const UNNAMED = 'A teammate';

export type AskCardProps = {
  ask: MyAsk;
  /** The person reading, the one asked: named "you" by their own face. */
  you: FeedbackPerson;
  /** Where "Answer" leads: the place the Ask is answered. */
  target: NavTarget;
};

/**
 * One Ask waiting on the person, in the feed card's grammar: "[face] Ann Lee to [face] you", an
 * `Ask` badge over the day it was asked, the Request message, and an "Answer" button. An asked
 * person sees only their own Ask, never who else was asked.
 *
 * The one thing said about who reads the answer is whether it goes on the Workspace feed — never
 * more (`ADR-0022`, `ADR-0046` in the brain).
 */
export function AskCard({ ask, you, target }: AskCardProps) {
  const requester: FeedbackPerson = {
    name: ask.requesterName,
    photoUrl: ask.requesterPhotoUrl,
    inactive: ask.requesterInactive,
    // The person asked is never the one who asked.
    isYou: false,
  };

  return (
    <article className="flex flex-col gap-3 py-5">
      <header className="flex items-start justify-between gap-3">
        <Text
          as="p"
          variant="subtitle-4"
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1"
        >
          <PersonChip person={requester} unnamed={UNNAMED} sentenceStart />
          <span className="text-fg-secondary">to</span>
          <PersonChip person={you} unnamed={UNNAMED} />
        </Text>
        <CardStamp label="Ask" tone="neutral" dateTime={ask.askedAt} />
      </header>
      <Text as="p" variant="body-1" className="whitespace-pre-line break-words">
        <FeedbackText text={ask.message} tags={ask.messageTags} />
      </Text>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {ask.onWorkspaceFeed ? (
          <Text
            as="p"
            variant="body-3"
            tone="muted"
            className="flex items-center gap-1.5"
          >
            <GlobeIcon aria-hidden="true" className="size-4 shrink-0" />
            Your answer goes on the Workspace feed.
          </Text>
        ) : (
          <span />
        )}
        <Button asChild variant="primary" size="sm">
          <TargetLink target={target}>
            Answer
            <span className="sr-only">{` ${requester.name ?? UNNAMED}’s Ask`}</span>
          </TargetLink>
        </Button>
      </div>
    </article>
  );
}

/** An `AskCard` still loading: who asked whom, the corner, the question, the button. */
export function AskCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Skeleton shape="circle" className="size-6 shrink-0" />
          <Skeleton className="w-1/4 text-subtitle-4" />
          <Skeleton shape="circle" className="size-6 shrink-0" />
          <Skeleton className="w-12 text-subtitle-4" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <Skeleton shape="circle" className="h-4 w-10" />
          <Skeleton className="w-20 text-body-3" />
        </div>
      </div>
      <Skeleton className="w-4/5 text-body-1" />
      <div className="flex justify-end">
        <Skeleton shape="circle" className="h-9 w-24" />
      </div>
    </div>
  );
}
