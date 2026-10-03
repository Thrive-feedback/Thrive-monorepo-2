import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

export type SomethingWentWrongProps = {
  /** Next's reference for a failure on the server; quoting it finds the failure in the logs. */
  digest?: string;
  onRetry: () => void;
};

/**
 * What a person sees when a page could not be built — most often because the API did not
 * answer. It says so plainly, offers the one useful action, and shows the reference to quote.
 * The full-height backdrop is drawn here because it replaces the layout that normally draws it.
 */
export function SomethingWentWrong({
  digest,
  onRetry,
}: SomethingWentWrongProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-linear-to-b from-backdrop to-backdrop-tint px-4 py-12 text-center">
      <div className="flex flex-col gap-3">
        <Text variant="display5" as="h1">
          Something went wrong
        </Text>
        <Text variant="body2" tone="muted">
          Thrive could not load this page. Try again in a moment.
        </Text>
      </div>
      <Button variant="primary" onClick={onRetry}>
        Try again
      </Button>
      {digest && (
        <Text variant="caption" tone="muted">
          Reference: {digest}
        </Text>
      )}
    </main>
  );
}
