import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import {
  OneOnOneTemplate,
  type OneOnOneTemplateScope,
} from '../../../domain/entity/one-on-one-template.entity';
import { OneOnOneTemplateRepository } from '../../../domain/repository/one-on-one-template-repository.port';
import { OneOnOneTemplateContent } from '../../../domain/value-object/one-on-one-template-content.vo';
import { oneOnOneTemplateLayerKey } from '../../service/one-on-one-keys.service';
import type { OneOnOneTemplateContentInput } from '../../types/one-on-one-template.types';

export interface KeepOneOnOneTemplateInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
  readonly scope: OneOnOneTemplateScope;
  readonly content: OneOnOneTemplateContentInput;
}

export interface KeepOneOnOneTemplateResult {
  readonly id: string;
}

/**
 * Somebody keeps a new 1:1 template: one of their own, which nobody else sees, or, as an Admin, one
 * for everyone in the Workspace. Starting from one of Thrive's or another layer's is the same call,
 * with what they copied. A name the layer already keeps, in any letter case, is refused, and so is
 * one template more than a layer keeps.
 */
@Injectable()
export class KeepOneOnOneTemplateUseCase {
  constructor(
    private readonly templateRepository: OneOnOneTemplateRepository,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    input: KeepOneOnOneTemplateInput,
  ): Promise<KeepOneOnOneTemplateResult> {
    const isAdmin =
      input.scope === 'WORKSPACE' &&
      (await this.workspaceMembershipPort.isAdminOf({
        workspaceId: input.workspaceId,
        accountId: input.accountId,
      }));
    const template = OneOnOneTemplate.keep({
      id: this.idGenerator.next(),
      workspaceId: input.workspaceId,
      scope: input.scope,
      by: { accountId: input.accountId, isAdmin },
      content: OneOnOneTemplateContent.of(input.content),
    });
    const { ownerAccountId } = template.snapshot();
    await this.unitOfWork.run(
      async () => {
        const kept = await this.templateRepository.keptIn(input.workspaceId, {
          scope: input.scope,
          ownerAccountId,
        });
        OneOnOneTemplate.assertFitsBeside(template, kept);
        await this.templateRepository.save(template);
      },
      {
        serializeOn: oneOnOneTemplateLayerKey(
          input.workspaceId,
          ownerAccountId,
        ),
      },
    );
    return { id: template.snapshot().id };
  }
}
