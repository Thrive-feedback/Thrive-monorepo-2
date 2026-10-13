/**
 * Every page path in the web app, written once. Links, redirects and router calls read
 * from here, so moving a page is one edit rather than a search for string literals.
 *
 * Paths only, never full URLs: the origin is the deployment's, not the code's.
 */
export const ROUTES = {
  landing: '/',
  signIn: '/signin',
  home: '/home',
  feedback: {
    /** The Feedback Requests the signed-in person sent. */
    sent: '/feedback/sent',
    /** The Asks waiting for the signed-in person to answer. */
    asks: '/feedback/asks',
    /** One Ask waiting for them, where they write the answer. */
    askById: (askId: string) => `/feedback/asks/${askId}`,
    requestById: (requestId: string) => `/feedback/requests/${requestId}`,
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
