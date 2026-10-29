import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import BrandNewHome from './page';

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
vi.mock('@/components/atoms/one-time-toast', () => ({
  OneTimeToast: ({ message, then }: { message: string; then: string }) => (
    <output data-then={then}>{message}</output>
  ),
}));

beforeEach(() => {
  requireMember.mockResolvedValue({
    membership: { workspace: { id: 'w-1', name: 'Globex' }, role: 'MEMBER' },
  });
});

function open(searchParams: Record<string, string> = {}) {
  return BrandNewHome({ searchParams: Promise.resolve(searchParams) });
}

describe('BrandNewHome', () => {
  it('lets only a Member in, and is headed Home', async () => {
    render(await open());

    expect(requireMember).toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Home' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('says once that the person has just switched to this Workspace', async () => {
    render(await open({ opened: '1' }));

    expect(screen.getByRole('status')).toHaveTextContent('Switched to Globex');
    expect(screen.getByRole('status')).toHaveAttribute(
      'data-then',
      ROUTES.brandNewHome,
    );
  });
});
