import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkspaceSetupStepCount } from './workspace-setup-step-count';

describe('WorkspaceSetupStepCount', () => {
  it.each([
    ['create-workspace', 'Step 1 / 2', 'Step 1 of 2'],
    ['invite-teammates', 'Step 2 / 2', 'Step 2 of 2'],
  ] as const)('shows %s as %s, read out as %s', (step, shown, spoken) => {
    render(<WorkspaceSetupStepCount currentStep={step} />);

    expect(screen.getByText(shown)).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText(spoken)).toBeInTheDocument();
  });

  it('is not a heading, so the page heading stays first', () => {
    render(<WorkspaceSetupStepCount currentStep="create-workspace" />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
