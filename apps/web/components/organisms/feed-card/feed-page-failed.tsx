import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

export type FeedPageFailedProps = {
  /** Reads the page again. */
  onRetry: () => void;
};

/** The foot of Home's feed when the next page could not be read, with a way to try again. */
export function FeedPageFailed({ onRetry }: FeedPageFailedProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-5">
      <Text as="p" variant="body-2" tone="muted">
        We couldn&apos;t load the Feed.
      </Text>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
