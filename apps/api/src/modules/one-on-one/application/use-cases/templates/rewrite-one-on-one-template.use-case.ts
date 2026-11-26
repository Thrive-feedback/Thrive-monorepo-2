import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneTemplate } from '../../../domain/entity/one-on-one-template.entity';
import { OneOnOneTemplateRepository } from '../../../domain/repository/one-on-one-template-repository.port';
import { OneOnOneTemplateContent } from '../../../domain/value-object/one-on-one-template-content.vo';
import { OneOnOneTemplateNotFoundError } from '../../one-on-one.errors';
import { oneOnOneTemplateLayerKey } from '../../service/one-on-one-keys.service';
import type { OneOnOneTemplateContentInput } from '../../types/one-on-one-template.types';

export interface RewriteOneOnOneTemplateInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
  readonly templateId: string;
  readonly content: OneOnOneTemplateContentInput;
}

/**
 * Somebody rewrites a template they may change: their own, or the Workspace's as an Admin. Every
 * agenda opened from it later uses what it says now; one already open keeps its questions.
 */
@Injectable()
export class RewriteOneOnOneTemplateUseCase {
  constructor(
    private readonly templateRepository: OneOnOneTemplateRepository,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: RewriteOneOnOneTemplateInput): Promise<void> {
    const content = OneOnOneTemplateContent.of(input.content);
    const found = await this.templateRepository.findById(
      input.workspaceId,
      input.templateId,
    );
    if (!found?.isChoosableBy(input.accountId)) {
      throw new OneOnOneTemplateNotFoundError();
    }
    const { scope, ownerAccountId } = found.snapshot();
    const isAdmin =
      scope === 'WORKSPACE' &&
      (await this.workspaceMembershipPort.isAdminOf({
        workspaceId: input.workspaceId,
        accountId: input.accountId,
      }));
    await this.unitOfWork.run(
      async () => {
        // Read again under the layer's lock, so a rewrite never undoes a removal just made.
        const template = await this.templateRepository.findById(
          input.workspaceId,
          input.templateId,
        );
        if (!template?.isChoosableBy(input.accountId)) {
          throw new OneOnOneTemplateNotFoundError();
        }
        template.rewrite({ accountId: input.accountId, isAdmin }, content);
        OneOnOneTemplate.assertFitsBeside(
          template,
          await this.templateRepository.keptIn(input.workspaceId, {
            scope,
            ownerAccountId,
          }),
        );
        await this.templateRepository.save(template);
      },
      {
        serializeOn: oneOnOneTemplateLayerKey(
          input.workspaceId,
          ownerAccountId,
        ),
      },
    );
  }
}
