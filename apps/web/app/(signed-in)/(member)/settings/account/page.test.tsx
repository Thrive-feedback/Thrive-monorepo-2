import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Account from './page';

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Google',
  profile: { fullName: 'Ann Marie Lee', displayName: 'Ann Lee', slug: 'ann' },
  membership: { workspace: { id: 'w-1', name: 'Acme Corp' }, role: 'OWNER' },
};

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
vi.mock('@/lib/session/session-actions.service', () => ({
  signOut: vi.fn(),
}));

function definitionOf(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling;
}

describe('Account', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(Account()).rejects.toThrow('redirect:/signin');
  });

  it('is headed with the name the person goes by', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Account());

    expect(
      screen.getByRole('heading', { level: 2, name: 'Ann Lee' }),
    ).toBeInTheDocument();
  });

  it('shows their names, email and Role', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Account());

    expect(definitionOf('Full name')).toHaveTextContent('Ann Marie Lee');
    expect(definitionOf('Display name')).toHaveTextContent('Ann Lee');
    expect(definitionOf('Email')).toHaveTextContent('ann@acme.test');
    expect(definitionOf('Role')).toHaveTextContent('Owner');
  });

  it('offers Sign out', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Account());

    expect(
      screen.getByRole('button', { name: 'Sign out' }),
    ).toBeInTheDocument();
  });
});
