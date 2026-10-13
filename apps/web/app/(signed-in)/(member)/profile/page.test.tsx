import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProfilePage from './page';

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Google',
  profile: { fullName: 'Ann Marie Lee', displayName: 'Ann Lee', slug: 'ann' },
  membership: {
    workspace: { id: 'w-1', name: 'Acme Corp' },
    role: 'OWNER',
  },
};

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));

function definitionOf(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling;
}

describe('ProfilePage', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(ProfilePage()).rejects.toThrow('redirect:/signin');
  });

  it('is headed with the name the person goes by', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await ProfilePage());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Ann Lee' }),
    ).toBeInTheDocument();
  });

  it('shows their names, email, Workspace and Role', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await ProfilePage());

    expect(definitionOf('Full name')).toHaveTextContent('Ann Marie Lee');
    expect(definitionOf('Display name')).toHaveTextContent('Ann Lee');
    expect(definitionOf('Email')).toHaveTextContent('ann@acme.test');
    expect(definitionOf('Workspace')).toHaveTextContent('Acme Corp');
    expect(definitionOf('Role')).toHaveTextContent('Owner');
  });
});
