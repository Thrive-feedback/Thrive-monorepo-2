import { Injectable } from '@nestjs/common';
import {
  type AccountSummary,
  AccountSummaryPort,
} from '../../domain/port/account-summary.port';
import { HasProfilePort } from '../../domain/port/has-profile.port';
import { ProfileNamePort } from '../../domain/port/profile-name.port';
import { FindAccountSummariesUseCase } from '../use-cases/find-account-summaries.use-case';
import { FindProfileOfAccountUseCase } from '../use-cases/find-profile-of-account.use-case';

/**
 * Answers every port Identity publishes, each by delegating to a use case. Not to be confused
 * with `BetterAuthIdentityAdapter`, which is Identity's own way out to the sign-in provider.
 */
@Injectable()
export class IdentityAdapter
  implements HasProfilePort, ProfileNamePort, AccountSummaryPort
{
  constructor(
    private readonly findProfileOfAccountUseCase: FindProfileOfAccountUseCase,
    private readonly findAccountSummariesUseCase: FindAccountSummariesUseCase,
  ) {}

  async hasProfile(accountId: string): Promise<boolean> {
    return (
      (await this.findProfileOfAccountUseCase.execute({ accountId })) !== null
    );
  }

  async fullNameOf(accountId: string): Promise<string | null> {
    const profile = await this.findProfileOfAccountUseCase.execute({
      accountId,
    });
    return profile?.fullName ?? null;
  }

  summariesOf(accountIds: readonly string[]): Promise<AccountSummary[]> {
    return this.findAccountSummariesUseCase.execute({ accountIds });
  }
}
