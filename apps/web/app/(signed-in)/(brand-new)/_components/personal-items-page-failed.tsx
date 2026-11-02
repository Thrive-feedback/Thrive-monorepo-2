import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

export type PersonalItemsPageFailedProps = {
  /** Reads the page again. */
  onRetry: () => void;
};

/** A page of Received that could not be read, with a way to try again. */
export function PersonalItemsPageFailed({
  onRetry,
}: PersonalItemsPageFailedProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-5">
      <Text as="p" variant="body-2" tone="muted">
        We couldn&apos;t load this page.
      </Text>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
