import { Injectable } from '@nestjs/common';
import { ChatProvider } from '../../domain/value-object/chat-provider.vo';
import { LinkHandoff } from '../port/link-handoff.port';
import { AccountLinkerRegistry } from '../service/account-linker-registry.service';

export interface BeginAccountLinkInput {
  readonly accountId: string;
  /** Straight from the path, so it is checked here rather than trusted. */
  readonly provider: string;
}

export interface BeginAccountLinkResult {
  readonly authorizeUrl: string;
}

/**
 * Answers where to send a Member to authorise Thrive in their chat tool, with a signed `state`
 * that the return is checked against.
 *
 * There is no Role to check and no Workspace in the path: a Linked Account belongs to an
 * Account, and nobody can start a link for anybody but themselves because the Account comes
 * from the session.
 */
@Injectable()
export class BeginAccountLinkUseCase {
  constructor(
    private readonly accountLinkerRegistry: AccountLinkerRegistry,
    private readonly linkHandoff: LinkHandoff,
  ) {}

  async execute(input: BeginAccountLinkInput): Promise<BeginAccountLinkResult> {
    const provider = ChatProvider.of(input.provider).toString();
    const state = this.linkHandoff.signLinkStart({
      accountId: input.accountId,
      provider,
    });
    return {
      authorizeUrl: this.accountLinkerRegistry
        .for(provider)
        .authorizeUrl(state),
    };
  }
}
