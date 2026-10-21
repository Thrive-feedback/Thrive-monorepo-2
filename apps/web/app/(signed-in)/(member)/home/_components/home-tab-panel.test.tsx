import { act, render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

/** Set to hold Feedback for me's read open, so the panel's placeholder can be seen. */
let receivedRead: Promise<string> | undefined;

vi.mock('./sent-request-list', () => ({
  SentRequestList: () => <output>my requests list</output>,
}));
vi.mock('./waiting-ask-list', () => ({
  WaitingAskList: () => <output>waiting list</output>,
}));
vi.mock('./received-feedback-list', () => ({
  ReceivedFeedbackList: () =>
    receivedRead ? (
      <p>{use(receivedRead)}</p>
    ) : (
      <output>feedback for me list</output>
    ),
}));
vi.mock('./given-feedback-list', () => ({
  GivenFeedbackList: () => <output>given list</output>,
}));
vi.mock('./shared-feedback-list', () => ({
  SharedFeedbackList: () => <output>shared with me list</output>,
}));
vi.mock('./workspace-feed', () => ({
  WorkspaceFeed: () => <output>workspace feed</output>,
}));

const { HomeTabPanel } = await import('./home-tab-panel');

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

describe('HomeTabPanel', () => {
  it('shows the Workspace feed, read from the API rather than a mock', () => {
    render(<HomeTabPanel tab="workspace" membership={MEMBERSHIP} />);

    expect(screen.getByText('workspace feed')).toBeInTheDocument();
    expect(screen.queryByText(/Preview data/)).toBeNull();
  });

  it('draws only the open tab, so only its data is read', () => {
    render(<HomeTabPanel tab="my-requests" membership={MEMBERSHIP} />);

    expect(screen.getByText('my requests list')).toBeInTheDocument();
    expect(screen.queryByText('waiting list')).toBeNull();
    expect(screen.queryByText('feedback for me list')).toBeNull();
    expect(screen.queryByText('shared with me list')).toBeNull();
    expect(screen.queryByText('workspace feed')).toBeNull();
  });

  it('shows what was shared with the person, from the API rather than a mock', () => {
    render(<HomeTabPanel tab="shared" membership={MEMBERSHIP} />);

    expect(screen.getByText('shared with me list')).toBeInTheDocument();
    expect(screen.queryByText(/Preview data/)).toBeNull();
  });

  it('opens the Feedback written to the person on its own tab', () => {
    render(<HomeTabPanel tab="received" membership={MEMBERSHIP} />);

    expect(screen.getByText('feedback for me list')).toBeInTheDocument();
  });

  it('opens the Feedback the person has given on its own tab', () => {
    render(<HomeTabPanel tab="given" membership={MEMBERSHIP} />);

    expect(screen.getByText('given list')).toBeInTheDocument();
    expect(screen.queryByText('feedback for me list')).toBeNull();
  });

  it("holds the tab's place while its list is read, and shows the list once it is", async () => {
    let arrive: (text: string) => void = () => {};
    receivedRead = new Promise((resolve) => {
      arrive = resolve;
    });

    // A render that suspends has to be awaited, or React never retries it once the read lands.
    const { container } = await act(async () =>
      render(<HomeTabPanel tab="received" membership={MEMBERSHIP} />),
    );

    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
    expect(container).toHaveTextContent(/^$/);

    await act(async () => {
      arrive('Feedback for Ann');
      await receivedRead;
    });

    expect(await screen.findByText('Feedback for Ann')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="skeleton"]')).toBeNull();
    receivedRead = undefined;
  });
});
