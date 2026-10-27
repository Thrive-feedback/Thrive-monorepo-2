/**
 * Where a message Thrive sends out of Thrive points, mirroring `apps/web/lib/routes.constant.ts`.
 *
 * The API has no business knowing the web app's addresses, and almost everywhere it does not — the
 * bell is composed in the web app for that reason (design 0022 D12). A message that **leaves**
 * Thrive is the exception that has to: it has to carry an absolute URL, and only the API is there
 * to build one.
 *
 * It sits in `shared/` because two modules now compose such a message — Notifications, for a direct
 * message to one person, and Integrations, for a post into a Workspace's channel (`GEN_16` R5).
 *
 * **These paths and the web's `ROUTES` have to agree.** Changing a Home dialog parameter without
 * changing them sends people to a page that ignores it.
 */
export const WEB_PATHS = {
  ask: (askId: string) => `/home?tab=waiting&ask=${askId}`,
  request: (requestId: string) => `/home?tab=my-requests&request=${requestId}`,
  /**
   * No tab: the same Feedback sits on the Workspace feed, Shared with me or Feedback for me
   * depending on who follows the link, so no tab is true for every reader. Matches
   * `ROUTES.homeFeedback`.
   */
  feedback: (feedbackId: string) => `/home?feedback=${feedbackId}`,
  /**
   * Home itself, because **a Kudos has no permalink**: there is no route that reads one, and the
   * web's `ROUTES.homeKudos` is the toast shown after giving one rather than an address for
   * reading one. The Workspace feed on Home is where it appears. Thin, and it costs less here
   * than it would for Feedback, because the post already carries the words (brain `ADR-0045`).
   */
  home: () => '/home',
} as const;
