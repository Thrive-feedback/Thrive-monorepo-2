import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./sent-request-list', () => ({
  SentRequestList: () => <output>my requests list</output>,
}));
vi.mock('./waiting-ask-list', () => ({
  WaitingAskList: () => <output>waiting list</output>,
}));

const { HomeTabs } = await import('./home-tabs');

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

describe('HomeTabs', () => {
  it('links each tab to its address, in order', () => {
    render(<HomeTabs tab="workspace" membership={MEMBERSHIP} />);

    expect(
      screen
        .getAllByRole('tab')
        .map((tab) => [tab.textContent, tab.getAttribute('href')]),
    ).toEqual([
      ['Workspace feed', '/home'],
      ['Shared with me', '/home?tab=shared'],
      ['My requests', '/home?tab=my-requests'],
      ['Waiting for me', '/home?tab=waiting'],
    ]);
  });

  it('marks the open tab', () => {
    render(<HomeTabs tab="waiting" membership={MEMBERSHIP} />);

    expect(screen.getByRole('tab', { name: 'Waiting for me' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Workspace feed' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('shows the Workspace feed as preview data', () => {
    render(<HomeTabs tab="workspace" membership={MEMBERSHIP} />);

    expect(screen.getByText(/Preview data/)).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
  });

  it('draws only the open tab, so only its data is read', () => {
    render(<HomeTabs tab="my-requests" membership={MEMBERSHIP} />);

    expect(screen.getByText('my requests list')).toBeInTheDocument();
    expect(screen.queryByText('waiting list')).toBeNull();
    expect(screen.queryByText(/Preview data/)).toBeNull();
  });
});
