import { AUTH, type Auth } from '@app/infrastructure/auth/auth';
import { Inject, Injectable } from '@nestjs/common';
import {
  type MemberRoleChange,
  MemberRoleChanging,
} from '../../application/port/member-role-changing.port';

/**
 * Changes a Role through Better Auth's organization plugin, on the changer's own session, so the
 * plugin checks again that they may. The plugin names a Member by its own row id, which nothing
 * outside this adapter knows, so it is looked up here from the Workspace and the Account.
 */
@Injectable()
export class BetterAuthMemberRoleChangingAdapter extends MemberRoleChanging {
  constructor(@Inject(AUTH) private readonly auth: Auth) {
    super();
  }

  async change(change: MemberRoleChange): Promise<void> {
    const { adapter } = await this.auth.$context;
    const member = await adapter.findOne<{ id: string }>({
      model: 'member',
      where: [
        { field: 'organizationId', value: change.workspaceId },
        { field: 'userId', value: change.accountId },
      ],
    });
    if (!member) {
      // The use case found this Member a moment ago, inside the same lock.
      throw new Error('The Member whose Role is changing is gone.');
    }
    await this.auth.api.updateMemberRole({
      body: {
        memberId: member.id,
        // The plugin stores a Role by its own lowercase name.
        role: change.role.toLowerCase(),
        organizationId: change.workspaceId,
      },
      headers: new Headers({ cookie: change.credential }),
    });
  }
}
