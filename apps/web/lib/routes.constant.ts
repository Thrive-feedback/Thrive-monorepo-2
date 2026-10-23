/**
 * Every page path in the web app, written once. Links, redirects and router calls read
 * from here, so moving a page is one edit rather than a search for string literals.
 *
 * Paths only, never full URLs: the origin is the deployment's, not the code's.
 */
/** Home's feed tabs, in the order they are drawn. The first is the one Home opens on. */
export const HOME_TABS = [
  'workspace',
  'shared',
  'my-requests',
  'waiting',
  'received',
] as const;

export type HomeTab = (typeof HOME_TABS)[number];

export const ROUTES = {
  landing: '/',
  signIn: '/signin',
  home: '/home',
  /** The new Home, Feedback written as a letter, built here until it replaces `home`. */
  home2: '/home-2',
  /** One tab of Home's feed. `workspace` is the tab Home opens on, so it needs no query. */
  homeTab: (tab: HomeTab) =>
    tab === HOME_TABS[0] ? '/home' : `/home?tab=${tab}`,
  /** Home, saying once that the Feedback the person just gave was sent. */
  homeGiven: '/home?given=1',
  /**
   * Home, saying once that what the person just sent was dropped, because the page was drawn for
   * a Workspace they are no longer in: they switched in another tab, or were Deactivated there.
   */
  homeSwitched: '/home?switched=1',
  /** Home, saying once that the person has just switched to the Workspace it shows. */
  homeOpened: '/home?opened=1',
  /** Home of the Workspace the person is in now, saying once that they left the one before. */
  homeLeft: '/home?left=1',
  /** A Feedback Request the person sent, open in a dialog over My requests. */
  homeRequest: (requestId: string) =>
    `/home?tab=my-requests&request=${requestId}`,
  /** One Ask waiting for them, open in a dialog over Waiting for me, where they answer it. */
  homeAsk: (askId: string) => `/home?tab=waiting&ask=${askId}`,
  settings: {
    /** The settings menu; beside it on a wide screen, the Account section. */
    index: '/settings',
    /** The signed-in person's own Profile, read from the session, and Sign out. */
    account: '/settings/account',
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
    /** A first look at Feedback written as a letter. */
    letter: '/ui-showcase/letter',
    component: (slug: string) => `/ui-showcase/${slug}`,
  },
} as const;
