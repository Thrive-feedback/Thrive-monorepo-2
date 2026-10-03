import { Injectable } from '@nestjs/common';
import { type CurrentAccount, IdentityPort } from '../port/identity.port';

export interface GetCurrentAccountInput {
  readonly credential: string;
}

/** A query: who, if anyone, the request is signed in as. Being signed out is an answer. */
@Injectable()
export class GetCurrentAccountUseCase {
  constructor(private readonly identityPort: IdentityPort) {}

  execute(input: GetCurrentAccountInput): Promise<CurrentAccount | null> {
    return this.identityPort.currentAccount(input.credential);
  }
}
