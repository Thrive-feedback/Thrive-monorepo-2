import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/lib/test/render-with-intl';
import { CreateWorkspaceCard } from './create-workspace-card';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('CreateWorkspaceCard', () => {
  it('says Workspace, never Organization', () => {
    const { container } = renderWithIntl(<CreateWorkspaceCard />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Create a Workspace' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Workspace' }),
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/organi[sz]ation/i);
  });
});
