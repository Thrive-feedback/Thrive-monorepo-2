import { useTranslations } from 'next-intl';
import { Text } from '@/components/atoms/text';

const STEPS = ['create-workspace', 'invite-teammates'] as const;

export type WorkspaceSetupStep = (typeof STEPS)[number];

export type WorkspaceSetupStepCountProps = {
  currentStep: WorkspaceSetupStep;
};

/** Counted from one list of steps, so adding a step updates every page's count. Read aloud as "of". */
export function WorkspaceSetupStepCount({
  currentStep,
}: WorkspaceSetupStepCountProps) {
  const t = useTranslations('WorkspaceSetup');
  const position = STEPS.indexOf(currentStep) + 1;
  const count = { current: position, total: STEPS.length };

  return (
    <Text as="p" variant="display6">
      <span aria-hidden="true">{t('stepCount', count)}</span>
      <span className="sr-only">{t('stepCountSpoken', count)}</span>
    </Text>
  );
}
