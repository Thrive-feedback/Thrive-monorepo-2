import { HandUnderline } from '@/components/atoms/hand-underline';
import { Text } from '@/components/atoms/text';

/**
 * Centred over the card while the two stack; beside it, from `md` up, it reads from the left. The
 * heading's last words carry the landing page's hand-drawn underline.
 */
export function IntroduceYourselfHero() {
  return (
    <div className="flex flex-col gap-4 text-center md:text-start">
      <Text
        variant="display-4"
        as="h1"
        className="text-balance md:text-display-3"
      >
        Let’s make it <HandUnderline>official.</HandUnderline>
      </Text>
      <Text variant="body-1" tone="muted" className="md:text-subtitle-1">
        I’m putting the finishing touches on your desk. May I ask how you would
        like to be introduced to the team?
      </Text>
    </div>
  );
}
