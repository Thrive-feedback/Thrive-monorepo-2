import { WorkspaceSetupStepCount } from '@/app/(signed-in)/(top-nav)/register/_components/workspace-setup-step-count';
import { HandUnderline } from '@/components/atoms/hand-underline';
import { Text } from '@/components/atoms/text';

/**
 * Centred over the card while the two stack; beside it, from `md` up, it reads from the left. The
 * heading's last words carry the landing page's hand-drawn underline.
 */
export function InviteTeammatesHero() {
  return (
    <div className="flex flex-col gap-4 text-center md:text-start">
      <WorkspaceSetupStepCount currentStep="invite-teammates" />
      <Text
        variant="display-4"
        as="h1"
        className="text-balance md:text-display-3"
      >
        Thrive is better <HandUnderline>together</HandUnderline>
      </Text>
      <Text variant="body-1" tone="muted" className="md:text-subtitle-1">
        Who else deserves a kudo today? Invite them in.
      </Text>
    </div>
  );
}
