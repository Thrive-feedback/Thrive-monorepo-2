import { type ActorRequest, IS_PUBLIC } from '@app/shared/presentation/actor';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NotSignedInError } from '../application/identity.errors';
import { IdentityPort } from '../application/port/identity.port';

/**
 * Applied to every route: a caller without a live session is refused before any handler
 * runs, unless the route is `@Public()`. The caller's `cookie` header is the credential,
 * forwarded by the web server.
 */
@Injectable()
export class SignedInGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly identityPort: IdentityPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<ActorRequest>();
    const { account } = await this.identityPort.currentSession(
      request.headers.cookie ?? '',
    );
    if (!account) {
      throw new NotSignedInError();
    }
    request.actor = { accountId: account.id, email: account.email };
    return true;
  }
}
