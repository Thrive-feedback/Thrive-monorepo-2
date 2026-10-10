import { Injectable } from '@nestjs/common';
import {
  type GoogleSignIn,
  type GoogleSignInRequest,
  IdentityPort,
} from '../port/identity.port';

/**
 * A command: it records a sign-in attempt, so the callback can later prove it belongs to
 * the browser that started it.
 */
@Injectable()
export class StartGoogleSignInUseCase {
  constructor(private readonly identityPort: IdentityPort) {}

  execute(input: GoogleSignInRequest): Promise<GoogleSignIn> {
    return this.identityPort.startGoogleSignIn(input);
  }
}
