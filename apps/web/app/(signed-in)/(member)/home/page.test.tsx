import { render, screen } from '@testing-library/react';
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
vi.mock('./_components/home-tabs', () => ({
  HomeTabs: ({ tab, tabs }: { tab: string; tabs?: readonly string[] }) => (
    <output>{`tab: ${tab} of ${tabs?.join(', ') ?? 'all'}`}</output>
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

    expect(screen.getByText(/Preview data/)).toBeInTheDocument();
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

    expect(screen.getByText('tab: workspace of all')).toBeInTheDocument();
    expect(
      screen.getByText('tab: shared of shared, my-requests, waiting'),
    ).toBeInTheDocument();
  });

  it('opens the tab the address names, and the Workspace feed for an unknown one', async () => {
    requireMember.mockResolvedValue(ANN);

    const { unmount } = render(await open({ tab: 'waiting' }));
    expect(screen.getByText('tab: waiting of all')).toBeInTheDocument();
    expect(
      screen.getByText('tab: waiting of shared, my-requests, waiting'),
    ).toBeInTheDocument();
    unmount();

    render(await open({ tab: 'nope' }));
    expect(screen.getByText('tab: workspace of all')).toBeInTheDocument();
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
});
