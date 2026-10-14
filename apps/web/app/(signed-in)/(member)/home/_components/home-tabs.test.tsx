import { render, screen, within } from '@testing-library/react';
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
      within(screen.getByRole('navigation', { name: 'Feedback' }))
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Workspace feed', '/home'],
      ['Shared with me', '/home?tab=shared'],
      ['My requests', '/home?tab=my-requests'],
      ['Waiting for me', '/home?tab=waiting'],
    ]);
  });

  it('offers only the tabs it is given, in their order', () => {
    render(
      <HomeTabs
        tab="shared"
        membership={MEMBERSHIP}
        tabs={['shared', 'my-requests', 'waiting']}
      />,
    );

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(
      ['Shared with me', 'My requests', 'Waiting for me'],
    );
  });

  it('marks the open tab', () => {
    render(<HomeTabs tab="waiting" membership={MEMBERSHIP} />);

    expect(
      screen.getByRole('link', { name: 'Waiting for me' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'Workspace feed' }),
    ).not.toHaveAttribute('aria-current');
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
