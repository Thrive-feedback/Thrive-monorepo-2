import { WorkspaceSetupStepCount } from '@/app/(public)/register/_components/workspace-setup-step-count';
import { Text } from '@/components/atoms/text';

/** Centred over the card while the two stack; beside it, from `md` up, it reads from the left. */
export function CreateWorkspaceHero() {
  return (
    <div className="flex flex-col gap-4 text-center md:text-start">
      <WorkspaceSetupStepCount currentStep="create-workspace" />
      <Text variant="display5" as="h1" className="md:text-display3">
        Welcome! Let’s set up your team’s home.
      </Text>
      <Text variant="body2" tone="muted">
        Give your new Workspace a name.
        <br />
        You can invite your team in the next step.
      </Text>
    </div>
  );
}
