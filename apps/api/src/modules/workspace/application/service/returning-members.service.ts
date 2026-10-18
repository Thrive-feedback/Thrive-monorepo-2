import { AccountByEmailPort } from '@app/modules/identity';
import { Injectable } from '@nestjs/common';
import { MembershipQuery } from '../query-port/membership.query-port';

/**
 * Which of the addresses an Admin is inviting belong to someone Deactivated in the Workspace: a
 * person who left and is being invited back (brain `ADR-0034` decision 8). Shared by sending and
 * resending, which both store such a person's Invitation another way (ADR 0050).
 */
@Injectable()
export class ReturningMembers {
  constructor(
    private readonly accountByEmailPort: AccountByEmailPort,
    private readonly membershipQuery: MembershipQuery,
  ) {}

  /** The addresses among `emails`, lowercased, of people Deactivated in the Workspace. */
  async addressesAmong(
    workspaceId: string,
    emails: readonly string[],
  ): Promise<ReadonlySet<string>> {
    const accounts = await this.accountByEmailPort.accountsWithEmails(emails);
    if (accounts.length === 0) {
      return new Set();
    }
    const deactivated = new Set(
      await this.membershipQuery.deactivatedAmong(
        workspaceId,
        accounts.map((account) => account.accountId),
      ),
    );
    return new Set(
      accounts
        .filter((account) => deactivated.has(account.accountId))
        .map((account) => account.email.toLowerCase()),
    );
  }
}
