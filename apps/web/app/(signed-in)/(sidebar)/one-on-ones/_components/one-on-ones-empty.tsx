import { MessagesSquareIcon } from 'lucide-react';
import { Text } from '@/components/atoms/text';

/**
 * A person with no 1:1 yet: what one is for in Thrive, plainly, under the way to begin, which stays
 * at the head of the page.
 */
export function OneOnOnesEmpty() {
  return (
    <section className="flex flex-col items-start gap-3 rounded-page border border-border-muted border-dashed px-inset-card py-10">
      <MessagesSquareIcon
        aria-hidden="true"
        className="size-6 text-fg-accent"
      />
      <Text as="h2" variant="subtitle-2">
        No 1:1s yet
      </Text>
      <Text as="p" variant="body-2" tone="muted" className="max-w-2xl">
        A 1:1 is a regular time for two people. Thrive keeps its schedule and,
        before each meeting, gathers the Feedback and Kudos that happened since
        the last one, so there is always something real to talk about. Invite a
        teammate to one with Create 1:1, above.
      </Text>
    </section>
  );
}
