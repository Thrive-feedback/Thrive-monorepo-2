import { Text } from '@/components/atoms/text';

/** Centred over the card while the two stack; beside it, from `md` up, it reads from the left. */
export function IntroduceYourselfHero() {
  return (
    <div className="flex flex-col gap-4 text-center md:text-start">
      <Text variant="display-5" as="h1" className="md:text-display-3">
        Let’s make it official.
      </Text>
      <Text variant="body-2" tone="muted">
        I’m putting the finishing touches on your desk. May I ask how you would
        like to be introduced to the team?
      </Text>
    </div>
  );
}
