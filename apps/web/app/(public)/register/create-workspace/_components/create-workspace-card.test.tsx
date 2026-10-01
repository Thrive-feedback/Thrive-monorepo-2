import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CreateWorkspaceCard } from './create-workspace-card';

describe('CreateWorkspaceCard', () => {
  it('says Workspace, never Organization', () => {
    const { container } = render(<CreateWorkspaceCard />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Create a Workspace' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Workspace' }),
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/organi[sz]ation/i);
  });
});
