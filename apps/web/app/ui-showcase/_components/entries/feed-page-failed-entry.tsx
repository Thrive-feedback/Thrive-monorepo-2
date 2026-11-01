import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { FeedPageFailedDemo } from './feed-page-failed-demo';

export function FeedPageFailedEntry() {
  return (
    <ShowcaseEntry
      name="FeedPageFailed"
      level="organism"
      origin="thrive"
      source="components/organisms/feed-card/feed-page-failed.tsx — Text + Button"
      summary="The foot of a list whose next page could not be read, with a way to try again. The cards already read stay."
      useFor="Under the cards on Home or Waiting for me, when reading the next page fails."
      avoidFor="A page that could not load at all: that is the route's error boundary."
      usage={`import { FeedPageFailed } from '@/components/organisms/feed-card/feed-page-failed';

{phase === 'failed' && <FeedPageFailed onRetry={readNextPage} />}`}
      props={[
        {
          name: 'onRetry',
          type: '() => void',
          description: 'Try again was pressed: read the page again.',
        },
      ]}
      accessibility={[
        'The way to try again is a button, named for what it does.',
      ]}
    >
      <StateCell label="The next page could not be read" wide>
        <FeedPageFailedDemo />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function FeedPageFailedPreview() {
  return <FeedPageFailedDemo />;
}
