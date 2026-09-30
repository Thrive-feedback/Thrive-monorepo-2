import { Text } from '@/components/atoms/text';

export function IntroduceYourselfHero() {
  return (
    <div className="flex flex-col gap-4">
      <Text variant="display3" as="h1">
        Let’s make it official.
      </Text>
      <Text variant="body2" tone="muted">
        I’m putting the finishing touches on your desk. May I ask how you would
        like to be introduced to the team?
      </Text>
    </div>
  );
}
