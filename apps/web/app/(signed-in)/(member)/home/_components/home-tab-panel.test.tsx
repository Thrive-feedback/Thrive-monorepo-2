import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./sent-request-list', () => ({
  SentRequestList: () => <output>my requests list</output>,
}));
vi.mock('./waiting-ask-list', () => ({
  WaitingAskList: () => <output>waiting list</output>,
}));
vi.mock('./received-feedback-list', () => ({
  ReceivedFeedbackList: () => <output>feedback for me list</output>,
}));

const { HomeTabPanel } = await import('./home-tab-panel');

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

describe('HomeTabPanel', () => {
  it('shows the Workspace feed as preview data', () => {
    render(<HomeTabPanel tab="workspace" membership={MEMBERSHIP} />);

    expect(screen.getByText(/Preview data/)).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
  });

  it('draws only the open tab, so only its data is read', () => {
    render(<HomeTabPanel tab="my-requests" membership={MEMBERSHIP} />);

    expect(screen.getByText('my requests list')).toBeInTheDocument();
    expect(screen.queryByText('waiting list')).toBeNull();
    expect(screen.queryByText('feedback for me list')).toBeNull();
    expect(screen.queryByText(/Preview data/)).toBeNull();
  });

  it('opens the Feedback written to the person on its own tab', () => {
    render(<HomeTabPanel tab="received" membership={MEMBERSHIP} />);

    expect(screen.getByText('feedback for me list')).toBeInTheDocument();
  });
});
