import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Lee',
  profile: { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' },
  membership: {
    workspace: { id: 'w-1', name: 'Acme Corp' },
    role: 'OWNER',
  },
};

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: (signedIn?: string) => requireMember(signedIn),
}));
vi.mock('./_components/feedback-composer-card', () => ({
  FeedbackComposerCard: ({ ownEmail }: { ownEmail: string }) => (
    <output>{`feedback composer as ${ownEmail}`}</output>
  ),
}));
vi.mock('./_components/workspace-feed', () => ({
  WorkspaceFeed: () => <output>workspace feed</output>,
}));
vi.mock('./_components/home-tab-panel', () => ({
  HomeTabPanel: ({ tab }: { tab: string }) => (
    <output>{`panel: ${tab}`}</output>
  ),
}));
vi.mock('@/components/organisms/home-dialog', () => ({
  HomeDialog: ({
    title,
    close,
    children,
  }: {
    title: string;
    close: { href: string };
    children: React.ReactNode;
  }) => (
    <section aria-label={title} data-close={close.href}>
      {children}
    </section>
  ),
}));
vi.mock('./_components/feedback-request-detail', () => ({
  FeedbackRequestDetail: ({ requestId }: { requestId: string }) => (
    <output>{`request ${requestId}`}</output>
  ),
}));
vi.mock('./_components/answer-ask-detail', () => ({
  AnswerAskDetail: ({ askId }: { askId: string }) => (
    <output>{`ask ${askId}`}</output>
  ),
}));
vi.mock('@/components/atoms/one-time-toast', () => ({
  OneTimeToast: ({
    type,
    message,
    then,
  }: {
    type: string;
    message: string;
    then: string;
  }) => <output>{`${type} toast: ${message} then ${then}`}</output>,
}));

function open(searchParams: Record<string, string> = {}) {
  return Home({ searchParams: Promise.resolve(searchParams) });
}

describe('Home', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(open()).rejects.toThrow('redirect:/signin');
  });

  it('tells the gate the person has just signed in, so a redirect keeps the toast', async () => {
    requireMember.mockResolvedValue(ANN);

    await open({ signedIn: '1' });

    expect(requireMember).toHaveBeenLastCalledWith('1');
  });

  it('is headed with the Workspace’s name, and welcomes the person on a wide screen', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Acme Corp' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to Acme Corp' }),
    ).toBeInTheDocument();
  });

  it('shows the Workspace feed beside the forms on a wide screen, with a handle to resize it', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(screen.getByText('workspace feed')).toBeInTheDocument();
    expect(screen.queryByText(/Preview data/)).toBeNull();
    expect(
      screen.getByRole('separator', { name: 'Resize Workspace feed' }),
    ).toBeInTheDocument();
  });

  it('lets the person ask for or give Feedback', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    // Once for each layout; CSS shows one.
    expect(
      screen.getAllByText('feedback composer as ann@acme.test'),
    ).toHaveLength(2);
  });

  it('opens the Workspace feed by default, and Shared with me beside the feed on a wide screen', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(screen.getByText('panel: workspace')).toBeInTheDocument();
    expect(screen.getByText('panel: shared')).toBeInTheDocument();
    const [narrow, wide] = screen.getAllByRole('navigation', {
      name: 'Feedback',
    });
    expect(
      within(narrow as HTMLElement).getByRole('link', {
        name: 'Workspace feed',
      }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(wide as HTMLElement)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Shared with me',
      'My requests',
      'Waiting for me',
      'Feedback for me',
    ]);
  });

  it('opens the tab the address names, and the Workspace feed for an unknown one', async () => {
    requireMember.mockResolvedValue(ANN);

    const { unmount } = render(await open({ tab: 'waiting' }));
    // Once for each layout; CSS shows one.
    expect(screen.getAllByText('panel: waiting')).toHaveLength(2);
    unmount();

    render(await open({ tab: 'nope' }));
    expect(screen.getByText('panel: workspace')).toBeInTheDocument();
  });

  it('says who signed in when Google has just sent them back', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open({ signedIn: '1' }));

    expect(
      screen.getByText('success toast: Signed in as ann@acme.test then /home'),
    ).toBeInTheDocument();
  });

  it('says once that a request was sent, and keeps My requests open', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open({ tab: 'my-requests', sent: '1' }));

    expect(
      screen.getByText(
        'success toast: Request sent then /home?tab=my-requests',
      ),
    ).toBeInTheDocument();
  });

  it('raises no toast on an ordinary visit', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(screen.queryByText(/toast/)).toBeNull();
  });

  const ID = '0199a0f0-0000-7000-8000-0000000000f1';

  it('opens the Feedback Request the address names in a dialog, closing back to its tab', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open({ tab: 'my-requests', request: ID }));

    const dialog = screen.getByRole('region', {
      name: 'Your feedback request',
    });
    expect(dialog).toHaveTextContent(`request ${ID}`);
    expect(dialog).toHaveAttribute('data-close', '/home?tab=my-requests');
  });

  it('opens the Ask the address names in a dialog, closing back to its tab', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open({ tab: 'waiting', ask: ID }));

    const dialog = screen.getByRole('region', { name: 'Give your feedback' });
    expect(dialog).toHaveTextContent(`ask ${ID}`);
    expect(dialog).toHaveAttribute('data-close', '/home?tab=waiting');
  });

  it('opens no dialog on an ordinary visit', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(screen.queryByRole('region')).toBeNull();
  });
});
