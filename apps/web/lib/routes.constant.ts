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
  /** One tab of Home's feed. `workspace` is the tab Home opens on, so it needs no query. */
  homeTab: (tab: HomeTab) =>
    tab === HOME_TABS[0] ? '/home' : `/home?tab=${tab}`,
  /** Home, saying once that the Feedback the person just gave was sent. */
  homeGiven: '/home?given=1',
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
    /** The Workspace's name, who is in it, and the Invitations still open. */
    workspace: '/settings/workspace',
    /** The colour mode. */
    appearance: '/settings/appearance',
  },
  invitation: (invitationId: string) => `/invitations/${invitationId}`,
  register: {
    introduceYourself: '/register/introduce-yourself',
    joinWorkspace: '/register/join-workspace',
    createWorkspace: '/register/create-workspace',
    inviteTeammates: '/register/invite-teammates',
  },
  uiShowcase: {
    index: '/ui-showcase',
    tokens: '/ui-showcase/tokens',
    component: (slug: string) => `/ui-showcase/${slug}`,
  },
} as const;
