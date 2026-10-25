import { HandUnderline } from '@/components/atoms/hand-underline';
import { Text } from '@/components/atoms/text';

/**
 * Centred over the card while the two stack; beside it, from `md` up, it reads from the left. The
 * heading's last words carry the landing page's hand-drawn underline.
 */
export function ChooseWorkspaceHero() {
  return (
    <div className="flex flex-col gap-4 text-center md:text-start">
      <Text
        variant="display-4"
        as="h1"
        className="text-balance md:text-display-3"
      >
        Where to <HandUnderline>today?</HandUnderline>
      </Text>
      <Text variant="body-1" tone="muted" className="md:text-subtitle-1">
        You belong to more than one Workspace.
        <br />
        Choose the one to open on this device.
      </Text>
    </div>
  );
}
