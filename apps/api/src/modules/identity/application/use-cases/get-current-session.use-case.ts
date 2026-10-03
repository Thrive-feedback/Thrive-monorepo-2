import { Injectable } from '@nestjs/common';
import { type CurrentSession, IdentityPort } from '../port/identity.port';

export interface GetCurrentSessionInput {
  readonly credential: string;
}

/**
 * A query: who, if anyone, the request is signed in as, and whether the session is due a
 * refresh. Being signed out is an answer. It never writes; refreshing is its own command.
 */
@Injectable()
export class GetCurrentSessionUseCase {
  constructor(private readonly identityPort: IdentityPort) {}

  execute(input: GetCurrentSessionInput): Promise<CurrentSession> {
    return this.identityPort.currentSession(input.credential);
  }
}
