import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PendingMiniPostcard } from './pending-mini-postcard';

const linkStatus = vi.fn();
vi.mock('next/link', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/link')>()),
  useLinkStatus: () => linkStatus(),
}));

beforeEach(() => {
  linkStatus.mockReturnValue({ pending: false });
});

function face() {
  const { container } = render(
    <PendingMiniPostcard kind="requested" date="2026-10-31T03:00:00.000Z" />,
  );
  return container.querySelector('[data-slot="mini-postcard-face"]');
}

describe('PendingMiniPostcard', () => {
  it('looks as ever until its link is pressed', () => {
    expect(face()).not.toHaveAttribute('data-pending');
  });

  it('shows the press was felt while the postcard is on its way', () => {
    linkStatus.mockReturnValue({ pending: true });

    expect(face()).toHaveAttribute('data-pending');
  });
});
