/**
 * The Workspace a session is in. Each sign-in, on each device, has its own, chosen by the person
 * (brain `ADR-0034` as adjusted on 2026-10-18): a new session is in none until they choose.
 */
export abstract class SessionWorkspace {
  /** The Workspace the caller's session is in, or `null` before one is chosen. */
  abstract selectedIn(credential: string): Promise<string | null>;

  /** Puts the caller's session in the Workspace. The caller has checked they are active there. */
  abstract select(credential: string, workspaceId: string): Promise<void>;
}
