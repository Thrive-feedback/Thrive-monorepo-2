import { KUDOS_GIVEN_TYPE } from '@app/modules/integrations';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { Outbox } from '@app/shared/application/outbox.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { Kudos } from '../../domain/entity/kudos.entity';
import { KudosRepository } from '../../domain/repository/kudos-repository.port';
import {
  KudosCard,
  type KudosCardSnapshot,
} from '../../domain/value-object/kudos-card.vo';
import { KudosMessage } from '../../domain/value-object/kudos-message.vo';
import { TagsService } from '../service/tags.service';

export interface GiveKudosInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. Never read from the body. */
  readonly giverAccountId: string;
  /** The Kudos as written; who it is for is read out of its @mentions. */
  readonly message: string;
  /** How it looks, or `null` when it was not written on a card. */
  readonly card: KudosCardSnapshot | null;
}

export interface GiveKudosResult {
  readonly id: string;
}

/**
 * The Giver gives Kudos to the teammates they @mention, or to the whole Workspace if they name
 * nobody (ADR 0074). Nobody is named beside the message: binding its tags is what finds the
 * recipients, and binding only ever finds active Members of this Workspace, so a slug naming a
 * stranger names nobody.
 *
 * **The Workspace's channel is told, and nobody else is.** A Kudos posted to a connected channel
 * carries its message, unlike Feedback, because it has no Visibility to respect — every Member
 * reads every Kudos already — and praise without its words says only that praise happened
 * somewhere else (brain `ADR-0045`). The bell line and the direct message for a Kudos are still
 * not built (ADR 0060).
 *
 * What a Kudos *is* has no brain ADR: ADR 0060 cites `ADR-0043` for it and that record was never
 * written. The glossary's Kudos row is the nearest thing until somebody writes it.
 */
@Injectable()
export class GiveKudosUseCase {
  constructor(
    private readonly kudosRepository: KudosRepository,
    private readonly tagsService: TagsService,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
    private readonly outbox: Outbox,
  ) {}

  async execute(input: GiveKudosInput): Promise<GiveKudosResult> {
    const message = KudosMessage.of(input.message);
    const card = input.card === null ? null : KudosCard.of(input.card);
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
      card,
    });

    const given = kudos.snapshot();

    await this.unitOfWork.run(async () => {
      await this.kudosRepository.save(kudos);
      // Enqueued in the Kudos's own transaction (ADR 0076). Unlike Feedback, the **message
      // travels**: a Kudos has no Visibility, so every Member can already read it, and one
      // announced without its words says only that praise happened somewhere else (brain
      // `ADR-0045`). Whether the Workspace has connected a channel is Integrations' (ADR 0062).
      await this.outbox.enqueue([
        {
          type: KUDOS_GIVEN_TYPE,
          idempotencyKey: `${KUDOS_GIVEN_TYPE}:${given.id}`,
          payload: {
            workspaceId: given.workspaceId,
            giverAccountId: given.giverAccountId,
            recipientAccountIds: given.recipientAccountIds,
            message: given.message,
            kudosId: given.id,
          },
        },
      ]);
    });

    return { id: given.id };
  }
}
