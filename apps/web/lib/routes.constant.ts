/**
 * Every page path in the web app, written once. Links, redirects and router calls read
 * from here, so moving a page is one edit rather than a search for string literals.
 *
 * Paths only, never full URLs: the origin is the deployment's, not the code's.
 */
/** What Home's filter can show, in the order offered. The first is what Home opens on. */
export const HOME_SHOWS = ['all', 'everyone', 'shared'] as const;

export type HomeShow = (typeof HOME_SHOWS)[number];

/** Home showing one choice of its filter; `all` is what it opens on, so it needs no query. */
function homeShowing(show: HomeShow) {
  return show === HOME_SHOWS[0] ? '/home' : `/home?show=${show}`;
}

/** How Received and Given can be laid out. The first is what each opens on. */
export const PERSONAL_VIEWS = ['list', 'grid'] as const;

export type PersonalView = (typeof PERSONAL_VIEWS)[number];

/** The view an address names, or the one those pages open on when it names none they know. */
export function personalViewOf(value: string | null): PersonalView {
  return PERSONAL_VIEWS.find((view) => view === value) ?? PERSONAL_VIEWS[0];
}

/** What Received can be narrowed to, in the order offered. The first is what it opens on. */
export const RECEIVED_SHOWS = ['all', 'requests', 'offered', 'kudos'] as const;

export type ReceivedShow = (typeof RECEIVED_SHOWS)[number];

/** What an address narrows Received to, or everything when it names nothing it knows. */
export function receivedShowOf(value: string | null): ReceivedShow {
  return RECEIVED_SHOWS.find((show) => show === value) ?? RECEIVED_SHOWS[0];
}

/**
 * Received laid out one way, showing one kind; `list` and `all` are what it opens on, so neither
 * needs a query.
 */
function receivedViewing(
  view: PersonalView,
  show: ReceivedShow = RECEIVED_SHOWS[0],
) {
  const query = new URLSearchParams();
  if (show !== RECEIVED_SHOWS[0]) {
    query.set('show', show);
  }
  if (view !== PERSONAL_VIEWS[0]) {
    query.set('view', view);
  }
  const search = query.toString();
  return search === '' ? '/received' : `/received?${search}`;
}

/** Given laid out one way; `list` is what it opens on, so it needs no query. */
function givenViewing(view: PersonalView) {
  return view === PERSONAL_VIEWS[0] ? '/given' : `/given?view=${view}`;
}

/** The orders Waiting for me can be read in. The first is what it opens on. */
export const WAITING_SORTS = ['newest', 'oldest'] as const;

export type WaitingSortOrder = (typeof WAITING_SORTS)[number];

/** Waiting for me in one order; `newest` is what it opens on, so it needs no query. */
function waitingSorted(sort: WaitingSortOrder) {
  return sort === WAITING_SORTS[0] ? '/waiting' : `/waiting?sort=${sort}`;
}

export const ROUTES = {
  landing: '/',
  signIn: '/signin',
  /** Home of the person's Workspace, where a Member lands after signing in. */
  home: '/home',
  /** Home, saying once that the person has just switched to this Workspace. */
  homeOpened: '/home?opened=1',
  /** Home showing one choice of its filter. */
  homeShowing,
  /** One piece of Feedback open over Home, which keeps showing what it was showing. */
  homeFeedback: (feedbackId: string, show: HomeShow) => {
    const showing = homeShowing(show);
    return `${showing}${showing.includes('?') ? '&' : '?'}feedback=${feedbackId}`;
  },
  /** The Workspace's Kudos board. */
  kudos: '/kudos',
  /** The Kudos board narrowed to one month, `YYYY-MM`. */
  kudosMonth: (month: string) => `/kudos?month=${month}`,
  /** Everything written to the person. */
  received: '/received',
  /** Received laid out one way, showing one kind. */
  receivedViewing,
  /** One piece of Feedback open over Received, which stays laid out and narrowed as it was. */
  receivedFeedback: (
    feedbackId: string,
    view: PersonalView = PERSONAL_VIEWS[0],
    show: ReceivedShow = RECEIVED_SHOWS[0],
  ) => {
    const viewing = receivedViewing(view, show);
    return `${viewing}${viewing.includes('?') ? '&' : '?'}feedback=${feedbackId}`;
  },
  /** Everything the person wrote. */
  given: '/given',
  /** Given laid out one way. */
  givenViewing,
  /** One piece of Feedback open over Given, which stays laid out as it was. */
  givenFeedback: (
    feedbackId: string,
    view: PersonalView = PERSONAL_VIEWS[0],
  ) => {
    const viewing = givenViewing(view);
    return `${viewing}${viewing.includes('?') ? '&' : '?'}feedback=${feedbackId}`;
  },
  /** Every Ask waiting for the person. */
  waiting: '/waiting',
  /** Waiting for me in one order. */
  waitingSorted,
  /** One Ask open over Waiting for me, on the postcard it is answered on, keeping its order. */
  waitingAsk: (askId: string, sort: WaitingSortOrder = WAITING_SORTS[0]) => {
    const sorted = waitingSorted(sort);
    return `${sorted}${sorted.includes('?') ? '&' : '?'}ask=${askId}`;
  },
  /**
   * Home, saying once that what the person just sent was dropped, because the page was drawn for
   * a Workspace they are no longer in: they switched in another tab, or were Deactivated there.
   */
  homeSwitched: '/home?switched=1',
  /** Home of the Workspace the person is in now, saying once that they left the one before. */
  homeLeft: '/home?left=1',
  settings: {
    /** The settings menu; beside it on a wide screen, the Account section. */
    index: '/settings',
    /** The signed-in person's own Profile, read from the session, and Sign out. */
    account: '/settings/account',
    /**
     * Where a chat tool returns a Member once they have authorised Thrive to learn which
     * account there is theirs. The API builds the same address for the tool it sends them to,
     * so the segment here and the one it registers with that tool have to agree — and it is a
     * different address from the Workspace install's, which returns an Admin instead.
     */
    accountLinkCallback: (provider: string) =>
      `/settings/account/links/${provider}/callback`,
    /** The Workspace's name, the way to switch to another, and the way to leave it. */
    workspace: '/settings/workspace',
    /** The Workspace's Workspace Goals: read by every Member, added, hidden and shown by Admins. */
    workspaceGoals: '/settings/workspace-goals',
    /** Who is in the Workspace, and, for Admins, inviting more and the Invitations still open. */
    members: '/settings/members',
    /** The colour mode. */
    appearance: '/settings/appearance',
    /**
     * Where a chat tool returns an Admin once they have authorised Thrive in it. The API builds
     * the same address for the tool it sends them to, so the segment here and the one it
     * registers with that tool have to agree.
     */
    workspaceIntegrationCallback: (provider: string) =>
      `/settings/workspace/integrations/${provider}/callback`,
  },
  invitation: (invitationId: string) => `/invitations/${invitationId}`,
  /** Which of their Workspaces to open, for someone in several whose session is in none. */
  chooseWorkspace: '/choose-workspace',
  register: {
    introduceYourself: '/register/introduce-yourself',
    joinWorkspace: '/register/join-workspace',
    createWorkspace: '/register/create-workspace',
    inviteTeammates: '/register/invite-teammates',
  },
  uiShowcase: {
    index: '/ui-showcase',
    tokens: '/ui-showcase/tokens',
    /** Every card in the app, side by side. */
    cards: '/ui-showcase/cards',
    component: (slug: string) => `/ui-showcase/${slug}`,
  },
} as const;
