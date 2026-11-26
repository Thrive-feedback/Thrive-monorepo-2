import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneTemplateRepository } from '../../../domain/repository/one-on-one-template-repository.port';
import { OneOnOneTemplateNotFoundError } from '../../one-on-one.errors';
import { oneOnOneTemplateLayerKey } from '../../service/one-on-one-keys.service';

export interface RemoveOneOnOneTemplateInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
  readonly templateId: string;
}

/**
 * Somebody removes a template they may change. Nobody can choose it again and it is listed for
 * nobody, but the 1:1s already starting from it keep its questions until either person picks
 * another. Removing one already removed is refused as not found, as it is no longer anybody's.
 */
@Injectable()
export class RemoveOneOnOneTemplateUseCase {
  constructor(
    private readonly templateRepository: OneOnOneTemplateRepository,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: RemoveOneOnOneTemplateInput): Promise<void> {
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
        const template = await this.templateRepository.findById(
          input.workspaceId,
          input.templateId,
        );
        if (!template?.isChoosableBy(input.accountId)) {
          throw new OneOnOneTemplateNotFoundError();
        }
        template.remove(
          { accountId: input.accountId, isAdmin },
          this.clock.now(),
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
