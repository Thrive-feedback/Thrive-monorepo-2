import type { IntegrationProviderValue } from '../../domain/value-object/integration-provider.vo';

/** Who started an install, and into which Workspace and tool. */
export interface InstallStart {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly provider: IntegrationProviderValue;
}

/** The same, plus the space the tool said was authorised. */
export interface AuthorizedInstall extends InstallStart {
  readonly externalWorkspaceId: string;
  readonly externalWorkspaceName: string;
}

/**
 * Signs the two values an install carries through somebody's browser: the `state` that goes to
 * the chat tool and comes back, and the space that was authorised, which the Admin's next
 * request — choosing a channel — has to carry.
 *
 * Both are signed rather than stored, for the reason design 0020 D5 gives, and both are read
 * back as facts Thrive itself asserted. Nothing about which server was authorised is ever taken
 * from a request body: a signed claim is the browser carrying Thrive's own answer back to it.
 */
export abstract class InstallHandoff {
  abstract signInstallStart(start: InstallStart): string;

  /** `null` when the token was not signed here, was tampered with, or has expired. */
  abstract readInstallStart(token: string): InstallStart | null;

  abstract signAuthorizedInstall(install: AuthorizedInstall): string;

  /** `null` on the same three grounds. */
  abstract readAuthorizedInstall(token: string): AuthorizedInstall | null;
}
