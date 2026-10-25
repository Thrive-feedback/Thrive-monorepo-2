import { Text } from '@/components/atoms/text';

const STEPS = ['create-workspace', 'invite-teammates'] as const;

export type WorkspaceSetupStep = (typeof STEPS)[number];

export type WorkspaceSetupStepCountProps = {
  currentStep: WorkspaceSetupStep;
};

/**
 * Counted from one list of steps, so adding a step updates every page's count. Read aloud as "of";
 * written by hand and tilted, like the landing page's margin notes.
 */
export function WorkspaceSetupStepCount({
  currentStep,
}: WorkspaceSetupStepCountProps) {
  const position = STEPS.indexOf(currentStep) + 1;

  return (
    <Text
      as="p"
      variant="subtitle-handwrite-1"
      className="w-fit -rotate-3 self-center text-action-secondary-hover md:self-start"
    >
      <span aria-hidden="true">
        Step {position} / {STEPS.length}
      </span>
      <span className="sr-only">
        Step {position} of {STEPS.length}
      </span>
    </Text>
  );
}
