import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

export type SomethingWentWrongProps = {
  /** Next's reference for a failure on the server; quoting it finds the failure in the logs. */
  digest?: string;
  onRetry: () => void;
  /**
   * `false` inside a layout that still stands — its navbar and its own `main` — so this draws a
   * block in that space instead of a whole page.
   */
  fullPage?: boolean;
};

/**
 * What a person sees when a page could not be built — most often because the API did not
 * answer. It says so plainly, offers the one useful action, and shows the reference to quote.
 * The full-height backdrop is drawn here because it replaces the layout that normally draws it.
 */
export function SomethingWentWrong({
  digest,
  onRetry,
  fullPage = true,
}: SomethingWentWrongProps) {
  const Root = fullPage ? 'main' : 'div';
  return (
    <Root
      className={
        fullPage
          ? 'flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-12 text-center'
          : 'm-auto flex flex-col items-center justify-center gap-6 text-center'
      }
    >
      <div className="flex flex-col gap-3">
        <Text variant="display-5" as="h1">
          Something went wrong
        </Text>
        <Text variant="body-2" tone="muted">
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
    </Root>
  );
}
