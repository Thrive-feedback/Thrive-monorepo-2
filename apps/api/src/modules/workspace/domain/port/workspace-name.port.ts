/**
 * Published: what one Workspace is called.
 *
 * Narrow on purpose, and separate from `WorkspaceMembershipPort`, whose contract says in so many
 * words that names stay inside Workspace. That boundary is about not handing other modules the
 * Members and their Roles; a Workspace's own name is a different thing — every Member of it
 * already sees it on every screen.
 *
 * It exists because a direct message has to say which Workspace it is about. One Account can be
 * a Member of several (brain `ADR-0034`) and all of them reach the same chat conversation, so
 * "Nut asked you for feedback" is ambiguous the moment somebody joins a second, and a link only
 * resolves that after it is clicked (design 0021 D11).
 */
export abstract class WorkspaceNamePort {
  /** `null` when no Workspace has that id, which the caller words rather than throwing. */
  abstract nameOf(workspaceId: string): Promise<string | null>;
}
