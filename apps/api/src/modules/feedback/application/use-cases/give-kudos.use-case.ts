import { ChannelAnnouncerPort } from '@app/modules/integrations';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(GiveKudosUseCase.name);

  constructor(
    private readonly kudosRepository: KudosRepository,
    private readonly tagsService: TagsService,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
    private readonly channelAnnouncerPort: ChannelAnnouncerPort,
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

    await this.unitOfWork.run(() => this.kudosRepository.save(kudos));

    const given = kudos.snapshot();
    // After the Kudos has committed, and never awaited: saying well done must not be held up by
    // a chat tool, nor fail because one is unreachable (`ADR-0035` §8). Whether the Workspace has
    // connected a channel at all is Integrations' to know (ADR 0062).
    void this.channelAnnouncerPort
      .kudosGiven({
        workspaceId: given.workspaceId,
        giverAccountId: given.giverAccountId,
        recipientAccountIds: given.recipientAccountIds,
        message: given.message,
        kudosId: given.id,
      })
      .catch((error: unknown) => {
        // The port promises not to reject, so this is the belt to its braces.
        this.logger.warn({
          event: 'feedback.announce_failed',
          announcement: 'kudosGiven',
          error: error instanceof Error ? error.message : 'unknown',
        });
      });

    return { id: given.id };
  }
}
