import { AccountBySlugPort } from '@app/modules/identity';
import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { ActiveWorkspaceGoalPort } from '@app/modules/workspace-goal';
import { Injectable } from '@nestjs/common';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import { WrittenTags } from '../../domain/value-object/written-tags.vo';

/**
 * What text about to be sent in a Workspace is bound to: every active Workspace Goal of that
 * Workspace its hashtags name, and every active Member of it its slugs name. Anything else
 * written with a `#` or an `@` binds nothing and stays plain text.
 *
 * Asked once per send, whatever the text holds: one call to Workspace Goal, one to Identity and
 * one to Workspace, each skipped when there is nothing to ask it.
 */
@Injectable()
export class TagsService {
  constructor(
    private readonly activeWorkspaceGoalPort: ActiveWorkspaceGoalPort,
    private readonly accountBySlugPort: AccountBySlugPort,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
  ) {}

  async boundIn(
    workspaceId: string,
    ...texts: readonly string[]
  ): Promise<BoundTags> {
    const written = WrittenTags.in(...texts);
    const hashtags = written.hashtags();
    const slugs = written.slugs();
    const [workspaceGoals, accounts] = await Promise.all([
      hashtags.length === 0
        ? []
        : this.activeWorkspaceGoalPort.activeAmong({
            workspaceId,
            names: hashtags,
          }),
      slugs.length === 0 ? [] : this.accountBySlugPort.accountsWithSlugs(slugs),
    ]);
    const members = new Set(
      accounts.length === 0
        ? []
        : await this.workspaceMembershipPort.membersAmong({
            workspaceId,
            accountIds: accounts.map((account) => account.accountId),
          }),
    );
    return BoundTags.of({
      workspaceGoals: workspaceGoals.map((workspaceGoal) => ({
        workspaceGoalId: workspaceGoal.id,
        name: workspaceGoal.name,
      })),
      mentions: accounts
        .filter((account) => members.has(account.accountId))
        .map((account) => ({
          accountId: account.accountId,
          slug: account.slug,
          displayName: account.displayName,
        })),
    });
  }
}
