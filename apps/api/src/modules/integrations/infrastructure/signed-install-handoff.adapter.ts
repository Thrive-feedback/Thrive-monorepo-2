import type { SignedHandoff } from '@app/infrastructure/chat/signed-handoff';
import {
  type AuthorizedInstall,
  InstallHandoff,
  type InstallStart,
} from '../application/port/install-handoff.port';
import { IntegrationProvider } from '../domain/value-object/integration-provider.vo';

/** Long enough to authorise an app in another tab, short enough to be worth little if stolen. */
const STATE_LIFETIME_MS = 5 * 60 * 1000;

/** Longer, because a person is reading a list of channels and choosing one. */
const INSTALL_LIFETIME_MS = 15 * 60 * 1000;

/**
 * Each token says which of the two it is. Without it the longer-lived installation token would
 * also read as a `state`, because it carries every claim a `state` needs — so the 15-minute
 * value would be usable where only the 5-minute one is meant.
 */
const START_KIND = 'start';
const INSTALL_KIND = 'install';

const START_FIELDS = ['kind', 'accountId', 'workspaceId', 'provider'] as const;

const INSTALL_FIELDS = [
  ...START_FIELDS,
  'externalWorkspaceId',
  'externalWorkspaceName',
] as const;

/**
 * Signs and reads back the two values the install round trip carries, over the application's
 * HMAC helper. The provider is parsed on the way back, so a token holding a tool Thrive no
 * longer connects to reads as invalid rather than as that tool.
 */
export class SignedInstallHandoff extends InstallHandoff {
  constructor(private readonly signedHandoff: SignedHandoff) {
    super();
  }

  signInstallStart(start: InstallStart): string {
    return this.signedHandoff.sign(
      {
        kind: START_KIND,
        accountId: start.accountId,
        workspaceId: start.workspaceId,
        provider: start.provider,
      },
      STATE_LIFETIME_MS,
    );
  }

  readInstallStart(token: string): InstallStart | null {
    const claims = this.signedHandoff.verify(token, START_FIELDS);
    if (!claims || claims.kind !== START_KIND) {
      return null;
    }
    const provider = providerOf(claims.provider);
    return provider
      ? {
          accountId: claims.accountId,
          workspaceId: claims.workspaceId,
          provider,
        }
      : null;
  }

  signAuthorizedInstall(install: AuthorizedInstall): string {
    return this.signedHandoff.sign(
      {
        kind: INSTALL_KIND,
        accountId: install.accountId,
        workspaceId: install.workspaceId,
        provider: install.provider,
        externalWorkspaceId: install.externalWorkspaceId,
        externalWorkspaceName: install.externalWorkspaceName,
      },
      INSTALL_LIFETIME_MS,
    );
  }

  readAuthorizedInstall(token: string): AuthorizedInstall | null {
    const claims = this.signedHandoff.verify(token, INSTALL_FIELDS);
    if (!claims || claims.kind !== INSTALL_KIND) {
      return null;
    }
    const provider = providerOf(claims.provider);
    return provider
      ? {
          accountId: claims.accountId,
          workspaceId: claims.workspaceId,
          provider,
          externalWorkspaceId: claims.externalWorkspaceId,
          externalWorkspaceName: claims.externalWorkspaceName,
        }
      : null;
  }
}

function providerOf(raw: string) {
  try {
    return IntegrationProvider.of(raw).toString();
  } catch {
    // A token naming a tool this release does not connect to is one to refuse, not to report.
    return null;
  }
}
