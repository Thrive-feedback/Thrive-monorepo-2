import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import {
  FeedCardList,
  FeedCardListSkeleton,
} from '@/components/organisms/feed-card/feed-card-list';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { FeedEmpty } from '@/components/organisms/feed-card/feed-empty';
import {
  SAMPLE_FEED,
  SAMPLE_READER,
  SAMPLE_TARGET,
} from './feed-card-samples.constant';
import { FeedPageFailedDemo } from './feed-page-failed-demo';

const COMMON = {
  readerAccountId: SAMPLE_READER,
  targetFor: () => SAMPLE_TARGET,
};

export function FeedCardListEntry() {
  return (
    <ShowcaseEntry
      name="FeedCardList"
      level="organism"
      origin="thrive"
      source="components/organisms/feed-card/feed-card-list.tsx — one FeedCard for each piece"
      summary="The Home feed: many cards in one list, newest first, each Offered or Requested. This page shows the list. The cases of one card are on OfferedFeedbackCard and RequestedFeedbackCard."
      useFor="A list of Feedback in the Home menu, where each piece may be either kind."
      avoidFor="One card you already know the kind of: use OfferedFeedbackCard or RequestedFeedbackCard. /home's lists, which keep FeedbackCard until that page is replaced."
      usage={`import { FeedCardList } from '@/components/organisms/feed-card/feed-card-list';

<FeedCardList
  items={page.items}
  readerAccountId={page.readerAccountId}
  targetFor={(item) => ({ href: ROUTES.brandNewHomeFeedback(item.id, show) })}
/>`}
      props={[
        {
          name: 'items',
          type: 'HomeFeedItem[]',
          description:
            "The pieces, newest first. Each one's `origin` chooses its card.",
        },
        {
          name: 'readerAccountId',
          type: 'string',
          description: 'Who is reading, so each card can say "You".',
        },
        {
          name: 'targetFor',
          type: '(item: HomeFeedItem) => NavTarget',
          description: "What pressing a piece's small postcard does.",
        },
      ]}
      accessibility={[
        'A list, so a screen reader says how many cards it holds.',
        'Each card has one link, its small postcard.',
      ]}
    >
      <StateCell
        label="Many cards"
        hint="Both kinds together, as Home shows them."
        wide
      >
        <div className="w-full max-w-180">
          <FeedCardList items={SAMPLE_FEED} {...COMMON} />
        </div>
      </StateCell>
      <StateCell label="Loading" wide>
        <div className="w-full max-w-180">
          <FeedCardListSkeleton />
        </div>
      </StateCell>
      <StateCell
        label="Reading the next page"
        hint="A card in grey under the list while it scrolls."
        wide
      >
        <div className="flex w-full max-w-180 flex-col gap-1.5">
          <FeedCardList items={SAMPLE_FEED.slice(0, 2)} {...COMMON} />
          <FeedCardSkeleton />
        </div>
      </StateCell>
      <StateCell
        label="The next page could not be read"
        hint="At the foot of the list, with a way to try again."
        wide
      >
        <div className="flex w-full max-w-180 flex-col gap-1.5">
          <FeedCardList items={SAMPLE_FEED.slice(0, 2)} {...COMMON} />
          <FeedPageFailedDemo />
        </div>
      </StateCell>
      <StateCell label="All Feedback holds nothing" wide>
        <FeedEmpty show="all" />
      </StateCell>
      <StateCell label="Everyone in the Workspace holds nothing" wide>
        <FeedEmpty show="everyone" />
      </StateCell>
      <StateCell label="Shared with me holds nothing" wide>
        <FeedEmpty show="shared" />
      </StateCell>
    </ShowcaseEntry>
  );
}

/** One card of the list, in miniature: a face, two lines of words and the small postcard. */
function PreviewRow({ isRequested = false }: { isRequested?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 rounded-element bg-action-primary/8 p-1.5">
      <span className="size-3.5 shrink-0 rounded-full bg-surface-skeleton" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="h-1 w-3/4 rounded-full bg-surface-skeleton" />
        <span className="h-1 rounded-full bg-surface-skeleton" />
      </span>
      <span className="flex aspect-3/2 w-6 shrink-0 divide-x divide-border-muted rounded-inner border border-border-muted bg-surface-raised">
        <span className="flex-1" />
        {isRequested && <span className="flex-1" />}
      </span>
    </div>
  );
}

export function FeedCardListPreview() {
  return (
    <div className="flex w-40 flex-col gap-1">
      <PreviewRow />
      <PreviewRow isRequested />
      <PreviewRow />
    </div>
  );
}
