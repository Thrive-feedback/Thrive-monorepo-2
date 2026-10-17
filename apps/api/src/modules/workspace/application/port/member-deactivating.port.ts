export interface MemberDeactivation {
  readonly workspaceId: string;
  /** The Account whose membership ends. */
  readonly accountId: string;
  readonly deactivatedAt: Date;
}

/**
 * Ends an active Member's access to a Workspace and keeps their membership on record (glossary:
 * Deactivate). The caller has already checked who may, and that the Workspace keeps an Admin.
 */
export abstract class MemberDeactivating {
  abstract deactivate(deactivation: MemberDeactivation): Promise<void>;
}
