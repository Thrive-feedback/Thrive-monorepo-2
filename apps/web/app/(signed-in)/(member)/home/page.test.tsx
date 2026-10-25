import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import Home from './page';

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Lee',
  profile: { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' },
  membership: {
    workspace: { id: 'w-1', name: 'Acme Corp' },
    role: 'ADMIN',
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
vi.mock('./_components/invitation-notices', () => ({
  InvitationNotices: () => <output>invitation notices</output>,
}));
vi.mock('./_components/workspace-feed', () => ({
  WorkspaceFeed: () => <output>workspace feed</output>,
}));
vi.mock('./_components/waiting-ask-list', () => ({
  WaitingAskList: ({ headingAs }: { headingAs: string }) => (
    <output>{`waiting for me, as ${headingAs}`}</output>
  ),
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
  FeedbackRequestDetailSkeleton: () => null,
}));
vi.mock('./_components/answer-ask-detail', () => ({
  AnswerAskDetail: ({ askId }: { askId: string }) => (
    <output>{`ask ${askId}`}</output>
  ),
}));
vi.mock('./_components/feedback-detail', () => ({
  FeedbackDetail: ({ feedbackId }: { feedbackId: string }) => (
    <output>{`feedback ${feedbackId}`}</output>
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

/** The query of an address from `ROUTES`, as the framework hands it to the page. */
function paramsOf(href: string): Record<string, string> {
  return Object.fromEntries(new URL(href, 'https://thrive.test').searchParams);
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

  it('opens the Workspace feed by default, and Feedback for me beside the feed on a wide screen', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(screen.getByText('panel: workspace')).toBeInTheDocument();
    expect(screen.getByText('panel: received')).toBeInTheDocument();
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
    ).toEqual(['Feedback for me', 'My requests', 'Shared with me']);
    expect(
      within(narrow as HTMLElement)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Workspace feed',
      'Feedback for me',
      'My requests',
      'Shared with me',
    ]);
  });

  it('keeps what is waiting for the person in view above the tabs, in either layout', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    // Once for each layout, under the page's h1; CSS shows one.
    expect(screen.getAllByText('waiting for me, as h2')).toHaveLength(2);
  });

  it('opens the tab the address names, and the Workspace feed for an unknown one', async () => {
    requireMember.mockResolvedValue(ANN);

    const { unmount } = render(await open({ tab: 'my-requests' }));
    // Once for each layout; CSS shows one.
    expect(screen.getAllByText('panel: my-requests')).toHaveLength(2);
    unmount();

    render(await open({ tab: 'nope' }));
    expect(screen.getByText('panel: workspace')).toBeInTheDocument();
  });

  it('opens the default tabs for an address that names what is waiting, which is always in view', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open({ tab: 'waiting' }));

    expect(screen.getByText('panel: workspace')).toBeInTheDocument();
    expect(screen.getByText('panel: received')).toBeInTheDocument();
    expect(screen.getAllByText('waiting for me, as h2')).toHaveLength(2);
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

  it('says once that nothing was changed when the page was for a Workspace the person is no longer in', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open({ switched: '1' }));

    expect(
      screen.getByText(
        "error toast: Nothing was changed: that page was for another Workspace. You're in Acme Corp now. then /home",
      ),
    ).toBeInTheDocument();
  });

  it('says once that the person has just switched to this Workspace', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open({ opened: '1' }));

    expect(
      screen.getByText('success toast: Switched to Acme Corp then /home'),
    ).toBeInTheDocument();
  });

  it('says once that the person has just left a Workspace, naming the one they are in now', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open({ left: '1' }));

    expect(
      screen.getByText(
        "success toast: You left that Workspace. You're in Acme Corp now. then /home",
      ),
    ).toBeInTheDocument();
  });

  it('shows the Invitations waiting for the person, in either layout', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(screen.getAllByText('invitation notices')).toHaveLength(2);
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

  it('opens the Feedback the shared address names in a dialog, closing back to its tab', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open(paramsOf(ROUTES.homeFeedback(ID))));

    const dialog = screen.getByRole('region', { name: 'Feedback' });
    expect(dialog).toHaveTextContent(`feedback ${ID}`);
    expect(dialog).toHaveAttribute('data-close', '/home');
  });

  it('opens nothing for Feedback the address names by something that is not an id', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open({ feedback: 'nonsense' }));

    expect(screen.queryByRole('region')).toBeNull();
  });

  it('opens the request, then the Ask, then the Feedback when the address names several', async () => {
    const OTHER = '0199a0f0-0000-7000-8000-0000000000f2';
    const THIRD = '0199a0f0-0000-7000-8000-0000000000f3';
    requireMember.mockResolvedValue(ANN);

    const both = render(
      await open({ request: ID, ask: OTHER, feedback: THIRD }),
    );
    expect(
      screen.getByRole('region', { name: 'Your feedback request' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(1);
    both.unmount();

    render(await open({ ask: OTHER, feedback: THIRD }));
    expect(
      screen.getByRole('region', { name: 'Give your feedback' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(1);
  });

  it('opens no dialog on an ordinary visit', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(screen.queryByRole('region')).toBeNull();
  });
});
