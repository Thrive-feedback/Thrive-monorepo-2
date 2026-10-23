import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home2 from './page';

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));

describe('Home2', () => {
  it('lets only a Member in, and opens on a letter to write', async () => {
    render(await Home2());

    expect(requireMember).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Home' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Feedback message' }),
    ).toBeInTheDocument();
  });
});
