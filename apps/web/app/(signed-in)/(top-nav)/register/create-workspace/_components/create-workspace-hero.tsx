import { WorkspaceSetupStepCount } from '@/app/(signed-in)/(top-nav)/register/_components/workspace-setup-step-count';
import { HandUnderline } from '@/components/atoms/hand-underline';
import { Text } from '@/components/atoms/text';

/**
 * Centred over the card while the two stack; beside it, from `md` up, it reads from the left. The
 * heading's last words carry the landing page's hand-drawn underline.
 */
export function CreateWorkspaceHero() {
  return (
    <div className="flex flex-col gap-4 text-center md:text-start">
      <WorkspaceSetupStepCount currentStep="create-workspace" />
      <Text
        variant="display-4"
        as="h1"
        className="text-balance md:text-display-3"
      >
        Welcome! Let’s set up your <HandUnderline>team’s home.</HandUnderline>
      </Text>
      <Text variant="body-1" tone="muted" className="md:text-subtitle-1">
        Give your new Workspace a name.
        <br />
        You can invite your team in the next step.
      </Text>
    </div>
  );
}
