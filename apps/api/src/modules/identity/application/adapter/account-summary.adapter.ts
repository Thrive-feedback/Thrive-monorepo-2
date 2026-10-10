import { Injectable } from '@nestjs/common';
import {
  type AccountSummary,
  AccountSummaryPort,
} from '../../domain/port/account-summary.port';
import { FindAccountSummariesUseCase } from '../use-cases/find-account-summaries.use-case';

@Injectable()
export class AccountSummaryAdapter extends AccountSummaryPort {
  constructor(
    private readonly findAccountSummariesUseCase: FindAccountSummariesUseCase,
  ) {
    super();
  }

  summariesOf(accountIds: readonly string[]): Promise<AccountSummary[]> {
    return this.findAccountSummariesUseCase.execute({ accountIds });
  }
}
