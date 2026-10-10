import type { ActorRequest } from '@app/shared/presentation/actor';
import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { z } from 'zod';
import type { MembershipView } from '../application/types/membership.types';
import { ResolveMembershipUseCase } from '../application/use-cases/resolve-membership.use-case';
import { WorkspaceNotFoundError } from '../application/workspace.errors';

/** Where the guard parks the caller's membership for the handler to read. */
export interface MembershipRequest extends ActorRequest {
  membership?: MembershipView;
}

const workspaceIdSchema = z.uuid();

/**
 * On a route under `/v1/workspaces/:workspaceId`: resolves the signed-in caller to their
 * membership of that Workspace, and refuses anyone who is not a Member there. It runs before
 * the validation pipe, so it checks the id itself; a malformed one is just another Workspace
 * the caller is not in.
 */
@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    private readonly resolveMembershipUseCase: ResolveMembershipUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<MembershipRequest>();
    const workspaceId = workspaceIdSchema.safeParse(request.params.workspaceId);
    if (!request.actor || !workspaceId.success) {
      throw new WorkspaceNotFoundError();
    }
    request.membership = await this.resolveMembershipUseCase.execute({
      accountId: request.actor.accountId,
      workspaceId: workspaceId.data,
    });
    return true;
  }
}

/**
 * The caller's membership of the Workspace in the path. Only on a route behind
 * `WorkspaceMemberGuard`, which has already refused anyone who is not a Member there.
 */
export const CurrentMembership = createParamDecorator(
  (_data: unknown, context: ExecutionContext): MembershipView => {
    const { membership } = context
      .switchToHttp()
      .getRequest<MembershipRequest>();
    if (!membership) {
      throw new Error(
        'CurrentMembership was read on a route WorkspaceMemberGuard did not check.',
      );
    }
    return membership;
  },
);
