import { Injectable } from '@nestjs/common';
import { IdentityPort, type RefreshedSession } from '../port/identity.port';

export interface RefreshSessionInput {
  readonly credential: string;
}

/**
 * A command: pushes the caller's session forward, so a person who keeps using Thrive is
 * never signed out. It can only touch the caller's own session, so it needs no
 * authorization.
 */
@Injectable()
export class RefreshSessionUseCase {
  constructor(private readonly identityPort: IdentityPort) {}

  execute(input: RefreshSessionInput): Promise<RefreshedSession> {
    return this.identityPort.refreshSession(input.credential);
  }
}
