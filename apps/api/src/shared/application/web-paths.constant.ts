/**
 * Where a message Thrive sends out of Thrive points, mirroring `apps/web/lib/routes.constant.ts`.
 *
 * The API has no business knowing the web app's addresses, and almost everywhere it does not — the
 * bell is composed in the web app for that reason (design 0022 D12). A message that **leaves**
 * Thrive is the exception that has to: it has to carry an absolute URL, and only the API is there
 * to build one.
 *
 * It sits in `shared/` because two modules now compose such a message — Notifications, for a direct
 * message to one person, and Integrations, for a post into a Workspace's channel.
 *
 * **These paths and the web's `ROUTES` have to agree.** Changing a page's address or the parameter
 * that opens something over it without changing them sends people to a page that ignores it.
 */
export const WEB_PATHS = {
  /** The Ask open on Waiting for me, where it is answered. Matches `ROUTES.waitingAsk`. */
  ask: (askId: string) => `/waiting?ask=${askId}`,
  /**
   * Received narrowed to the requests the person sent, because **a request has no permalink**:
   * no page opens one on its own, so the link names the list it is on rather than the request.
   * Matches `ROUTES.receivedViewing('grid', 'requests')`.
   */
  requests: () => '/received?show=requests',
  /**
   * Home with the piece open over it. The same Feedback is on Home for some readers and only in
   * Received for others, but the postcard opens over Home for anyone who may read it. Matches
   * `ROUTES.homeFeedback(id, 'all')`.
   */
  feedback: (feedbackId: string) => `/home?feedback=${feedbackId}`,
  /**
   * The Workspace's Kudos board, because **a Kudos has no permalink**: there is no route that
   * reads one. The board is where it hangs. Thin, and it costs less here than it would for
   * Feedback, because the post already carries the words (brain `ADR-0045`).
   */
  kudos: () => '/kudos',
  /**
   * Received narrowed to the Kudos given to the person, for the same reason as `requests`: a
   * Kudos has no permalink, so a message telling somebody they were given one opens the list it
   * is on. Matches `ROUTES.receivedViewing(PERSONAL_VIEWS[0], 'kudos')`, the list.
   */
  kudosForMe: () => '/received?show=kudos',
} as const;

/**
 * A path from {@link WEB_PATHS} as an address somebody outside Thrive can follow. The origin is
 * the deployment's, read from configuration rather than guessed.
 */
export function webUrl(origin: string, path: string): string {
  return `${origin}${path}`;
}
