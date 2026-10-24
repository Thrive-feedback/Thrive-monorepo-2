import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Account from './page';

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Google',
  profile: { fullName: 'Ann Marie Lee', displayName: 'Ann Lee', slug: 'ann' },
  membership: { workspace: { id: 'w-1', name: 'Acme Corp' }, role: 'ADMIN' },
};

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
vi.mock('@/lib/session/session-actions.service', () => ({
  signOut: vi.fn(),
}));
vi.mock(
  '@/app/(signed-in)/(member)/settings/account/_components/linked-account-list',
  () => ({ LinkedAccountList: () => <output>chat tools</output> }),
);

function definitionOf(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling;
}

describe('Account', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(Account()).rejects.toThrow('redirect:/signin');
  });

  it('is headed with their full name', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Account());

    expect(
      screen.getByRole('heading', { level: 3, name: 'Ann Marie Lee' }),
    ).toBeInTheDocument();
  });

  it('shows the name others call them by and the address they sign in with', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Account());

    expect(definitionOf('Display name')).toHaveTextContent('Ann Lee');
    expect(definitionOf('Email')).toHaveTextContent('ann@acme.test');
  });

  it('leaves out the Profile slug, and the Role, which belongs to one Workspace', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Account());

    expect(screen.queryByText('Profile slug')).toBeNull();
    expect(screen.queryByText('Role', { selector: 'dt' })).toBeNull();
    expect(screen.queryByText('Full name', { selector: 'dt' })).toBeNull();
  });

  it('offers Sign out', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Account());

    expect(
      screen.getByRole('button', { name: 'Sign out' }),
    ).toBeInTheDocument();
  });
});
