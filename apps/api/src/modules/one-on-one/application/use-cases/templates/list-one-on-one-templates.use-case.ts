import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { Injectable } from '@nestjs/common';
import { mayChangeTemplate } from '../../../domain/entity/one-on-one-template.entity';
import { ThriveTemplate } from '../../../domain/value-object/thrive-template.vo';
import { OneOnOneTemplateQuery } from '../../query-port/one-on-one-template.query-port';
import type {
  OneOnOneTemplateList,
  OneOnOneTemplateView,
} from '../../types/one-on-one-template.types';

export interface ListOneOnOneTemplatesInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
}

/**
 * A query: the 1:1 templates somebody can start an agenda from, in three layers (brain ADR-0060
 * §8). Thrive's own come first, in the order Thrive ships them, then the Workspace's, then the
 * caller's own, each by name. Another Member's own are never listed.
 */
@Injectable()
export class ListOneOnOneTemplatesUseCase {
  constructor(
    private readonly templateQuery: OneOnOneTemplateQuery,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
  ) {}

  async execute(
    input: ListOneOnOneTemplatesInput,
  ): Promise<OneOnOneTemplateList> {
    const [kept, isAdmin] = await Promise.all([
      this.templateQuery.listSeenBy(input.workspaceId, input.accountId),
      this.workspaceMembershipPort.isAdminOf({
        workspaceId: input.workspaceId,
        accountId: input.accountId,
      }),
    ]);
    const thrives: OneOnOneTemplateView[] = ThriveTemplate.all().map(
      (template) => ({
        ...template.snapshot(),
        scope: 'THRIVE',
        changeable: false,
      }),
    );
    const keptViews: OneOnOneTemplateView[] = kept.map((row) => ({
      key: row.id,
      scope: row.scope,
      name: row.name,
      suggestedWhen: row.suggestedWhen,
      questions: row.questions,
      changeable: mayChangeTemplate(row, {
        accountId: input.accountId,
        isAdmin,
      }),
    }));
    return { items: [...thrives, ...keptViews], mayKeepForWorkspace: isAdmin };
  }
}
