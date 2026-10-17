export interface MemberReactivation {
  readonly workspaceId: string;
  /** The Account whose access comes back. */
  readonly accountId: string;
}

/**
 * Gives a Deactivated Member their access to the Workspace back, with the Role they had (glossary:
 * Deactivate). The caller has already checked who may, and that the person is Deactivated there.
 */
export abstract class MemberReactivating {
  abstract reactivate(reactivation: MemberReactivation): Promise<void>;
}
