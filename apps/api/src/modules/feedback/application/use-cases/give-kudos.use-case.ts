import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { Kudos } from '../../domain/entity/kudos.entity';
import { KudosRepository } from '../../domain/repository/kudos-repository.port';
import { KudosMessage } from '../../domain/value-object/kudos-message.vo';
import { TagsService } from '../service/tags.service';

export interface GiveKudosInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. Never read from the body. */
  readonly giverAccountId: string;
  /** The Kudos as written; who it is for is read out of its @mentions. */
  readonly message: string;
}

export interface GiveKudosResult {
  readonly id: string;
}

/**
 * The Giver gives Kudos to the teammates they @mention (brain `ADR-0043`). Nobody is named
 * beside the message: binding its tags is what finds the recipients, and binding only ever finds
 * active Members of this Workspace, so a slug naming a stranger, or nobody, gives nobody Kudos.
 *
 * Nobody is told yet: the bell and chat messages for Kudos are not built (ADR 0060).
 */
@Injectable()
export class GiveKudosUseCase {
  constructor(
    private readonly kudosRepository: KudosRepository,
    private readonly tagsService: TagsService,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: GiveKudosInput): Promise<GiveKudosResult> {
    const message = KudosMessage.of(input.message);
    const tags = await this.tagsService.boundIn(
      input.workspaceId,
      message.toString(),
    );
    const kudos = Kudos.give({
      id: this.idGenerator.next(),
      workspaceId: input.workspaceId,
      giverAccountId: input.giverAccountId,
      message,
      tags,
    });

    await this.unitOfWork.run(() => this.kudosRepository.save(kudos));

    return { id: kudos.snapshot().id };
  }
}
