import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';

/** Who is calling, as plain data, once the caller's credential has been checked. */
export interface Actor {
  readonly accountId: string;
  readonly email: string;
}

/** Where the guard parks the actor for the handler to read. */
export interface ActorRequest extends Request {
  actor?: Actor;
}

export const IS_PUBLIC = 'isPublic';

/**
 * Opens a route, or every route of a controller, to callers who are not signed in. Every
 * other route refuses them, so a route nobody thought about is closed rather than open.
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/**
 * The signed-in caller. Only on a route that is not `@Public()`, where the guard has
 * already refused anyone without a session; anywhere else it throws.
 */
export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor => {
    const { actor } = context.switchToHttp().getRequest<ActorRequest>();
    if (!actor) {
      throw new Error(
        'CurrentActor was read on a route the guard did not check.',
      );
    }
    return actor;
  },
);
