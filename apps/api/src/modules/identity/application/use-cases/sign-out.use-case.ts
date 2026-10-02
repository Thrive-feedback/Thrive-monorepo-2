import { Injectable } from '@nestjs/common';
import { IdentityPort, type SignedOut } from '../port/identity.port';

export interface SignOutInput {
  readonly credential: string;
}

/** A command. It can only end the caller's own session, so it needs no authorization. */
@Injectable()
export class SignOutUseCase {
  constructor(private readonly identity: IdentityPort) {}

  execute(input: SignOutInput): Promise<SignedOut> {
    return this.identity.signOut(input.credential);
  }
}
