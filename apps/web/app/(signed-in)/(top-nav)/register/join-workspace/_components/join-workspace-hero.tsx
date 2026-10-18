import { Text } from '@/components/atoms/text';

/** Centred over the card while the two stack; beside it, from `md` up, it reads from the left. */
export function JoinWorkspaceHero() {
  return (
    <div className="flex flex-col gap-4 text-center md:text-start">
      <Text variant="display-5" as="h1" className="md:text-display-3">
        Your team is already here.
      </Text>
      <Text variant="body-1" tone="muted">
        Choose the Workspace you want to join.
      </Text>
    </div>
  );
}
