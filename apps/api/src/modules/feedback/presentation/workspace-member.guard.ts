import { WorkspaceMembershipPort } from '@app/modules/workspace';
import type { ActorRequest } from '@app/shared/presentation/actor';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { z } from 'zod';
import { WorkspaceNotFoundError } from '../application/feedback-request.errors';

const workspaceIdSchema = z.uuid();

/**
 * On a route under `/v1/workspaces/:workspaceId`: refuses anyone who is not a Member of that
 * Workspace, so no Feedback use case can run outside one (`BE_21` R3, R4). It runs before the
 * validation pipe, so it checks the id itself; a malformed one is just another Workspace the
 * caller is not in.
 *
 * Workspace has a guard of its own doing the same job. It is not reused because it lives in
 * that module's `presentation/`, which `BE_02` R2 and `BE_03` R4 both put out of reach — only
 * the membership fact is published. The duplication is deliberate and noted in
 * `docs/design/0015-request-feedback.md`.
 */
@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ActorRequest>();
    const workspaceId = workspaceIdSchema.safeParse(request.params.workspaceId);
    if (!request.actor || !workspaceId.success) {
      throw new WorkspaceNotFoundError();
    }
    const isMember = await this.workspaceMembershipPort.isMemberOf({
      workspaceId: workspaceId.data,
      accountId: request.actor.accountId,
    });
    if (!isMember) {
      throw new WorkspaceNotFoundError();
    }
    return true;
  }
}
