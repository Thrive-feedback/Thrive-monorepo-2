import { Text } from '@/components/atoms/text';

/** Centred over the card while the two stack; beside it, from `md` up, it reads from the left. */
export function RequestFeedbackHero() {
  return (
    <div className="flex flex-col gap-4 text-center md:text-start">
      <Text variant="display-5" as="h1" className="md:text-display-3">
        Ask for Feedback
      </Text>
      <Text variant="body-2" tone="muted">
        Pick one teammate and say what you would like their view on. They answer
        in their own words, whenever suits them.
      </Text>
    </div>
  );
}
