import { Injectable } from '@nestjs/common';
import { type GoogleSignIn, IdentityPort } from '../port/identity.port';

/**
 * A command: it records a sign-in attempt, so the callback can later prove it belongs to
 * the browser that started it.
 */
@Injectable()
export class StartGoogleSignInUseCase {
  constructor(private readonly identity: IdentityPort) {}

  execute(): Promise<GoogleSignIn> {
    return this.identity.startGoogleSignIn();
  }
}
