import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeammatesPage from './page';

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
vi.mock('./_components/teammates', () => ({
  Teammates: () => <p>Everyone listed</p>,
  TeammatesSkeleton: () => null,
}));

beforeEach(() => {
  requireMember.mockResolvedValue({
    membership: { workspace: { id: 'w-1', name: 'Globex' }, role: 'MEMBER' },
  });
});

describe('Teammates page', () => {
  it('lets only a Member in, is headed Teammates, and says who is listed', async () => {
    render(await TeammatesPage());

    expect(requireMember).toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Teammates' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Everyone in Globex.')).toBeVisible();
    expect(screen.getByText('Everyone listed')).toBeInTheDocument();
  });
});
