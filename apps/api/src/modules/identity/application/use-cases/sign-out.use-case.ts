import { Injectable } from '@nestjs/common';
import { IdentityPort, type SignedOut } from '../port/identity.port';

export interface SignOutInput {
  readonly credential: string;
}

/** A command. It can only end the caller's own session, so it needs no authorization. */
@Injectable()
export class SignOutUseCase {
  constructor(private readonly identityPort: IdentityPort) {}

  execute(input: SignOutInput): Promise<SignedOut> {
    return this.identityPort.signOut(input.credential);
  }
}
