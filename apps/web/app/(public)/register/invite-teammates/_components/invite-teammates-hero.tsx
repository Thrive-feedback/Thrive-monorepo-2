import { WorkspaceSetupStepCount } from '@/app/(public)/register/_components/workspace-setup-step-count';
import { Text } from '@/components/atoms/text';

/** Centred over the card while the two stack; beside it, from `md` up, it reads from the left. */
export function InviteTeammatesHero() {
  return (
    <div className="flex flex-col gap-4 text-center md:text-start">
      <WorkspaceSetupStepCount currentStep="invite-teammates" />
      <Text variant="display5" as="h1" className="md:text-display3">
        Thrive is better together
      </Text>
      <Text variant="body2" tone="muted">
        Who else deserves a kudo today? Invite them in.
      </Text>
    </div>
  );
}
