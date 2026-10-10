import { Injectable } from '@nestjs/common';
import { ProfileNamePort } from '../../domain/port/profile-name.port';
import { FindProfileOfAccountUseCase } from '../use-cases/find-profile-of-account.use-case';

@Injectable()
export class ProfileNameAdapter extends ProfileNamePort {
  constructor(
    private readonly findProfileOfAccountUseCase: FindProfileOfAccountUseCase,
  ) {
    super();
  }

  async fullNameOf(accountId: string): Promise<string | null> {
    const profile = await this.findProfileOfAccountUseCase.execute({
      accountId,
    });
    return profile?.fullName ?? null;
  }
}
