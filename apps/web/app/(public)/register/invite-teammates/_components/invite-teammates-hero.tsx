import { useTranslations } from 'next-intl';
import { WorkspaceSetupStepCount } from '@/app/(public)/register/_components/workspace-setup-step-count';
import { Text } from '@/components/atoms/text';

/** Centred over the card while the two stack; beside it, from `md` up, it reads from the left. */
export function InviteTeammatesHero() {
  const t = useTranslations('InviteTeammates');

  return (
    <div className="flex flex-col gap-4 text-center md:text-start">
      <WorkspaceSetupStepCount currentStep="invite-teammates" />
      <Text variant="display5" as="h1" className="md:text-display3">
        {t('heading')}
      </Text>
      <Text variant="body2" tone="muted">
        {t('intro')}
      </Text>
    </div>
  );
}
