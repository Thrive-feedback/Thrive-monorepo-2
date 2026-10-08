/**
 * Published: whether an Account has introduced itself. Another module asks this before an
 * action that shows the person to others, such as founding a Workspace.
 */
export abstract class HasProfilePort {
  abstract hasProfile(accountId: string): Promise<boolean>;
}
