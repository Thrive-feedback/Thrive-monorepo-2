import { Text } from '@/components/atoms/text';

/** Centred over the card while the two stack; beside it, from `md` up, it reads from the left. */
export function ChooseWorkspaceHero() {
  return (
    <div className="flex flex-col gap-4 text-center md:text-start">
      <Text variant="display-5" as="h1" className="md:text-display-3">
        Where to today?
      </Text>
      <Text variant="body-1" tone="muted">
        You belong to more than one Workspace.
        <br />
        Choose the one to open on this device.
      </Text>
    </div>
  );
}
