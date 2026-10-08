import { Injectable } from '@nestjs/common';
import { HasProfilePort } from '../../domain/port/has-profile.port';
import { FindProfileOfAccountUseCase } from '../use-cases/find-profile-of-account.use-case';

@Injectable()
export class HasProfileAdapter extends HasProfilePort {
  constructor(
    private readonly findProfileOfAccountUseCase: FindProfileOfAccountUseCase,
  ) {
    super();
  }

  async hasProfile(accountId: string): Promise<boolean> {
    return (
      (await this.findProfileOfAccountUseCase.execute({ accountId })) !== null
    );
  }
}
