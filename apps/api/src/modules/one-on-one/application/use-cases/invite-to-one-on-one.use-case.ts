import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { Clock } from '@app/shared/application/clock.port';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOne } from '../../domain/entity/one-on-one.entity';
import { OneOnOneRepository } from '../../domain/repository/one-on-one-repository.port';
import { OneOnOneSchedule } from '../../domain/value-object/one-on-one-schedule.vo';
import {
  OneOnOneAlreadyExistsError,
  OneOnOnePersonNotFoundError,
} from '../one-on-one.errors';
import { oneOnOnePairKey } from '../service/one-on-one-keys.service';
import { OneOnOneTemplateCatalogService } from '../service/one-on-one-template-catalog.service';
import type { OneOnOneScheduleInput } from '../types/one-on-one.types';

export interface InviteToOneOnOneInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: they send the invitation. */
  readonly startedByAccountId: string;
  readonly invitedAccountId: string;
  readonly schedule: OneOnOneScheduleInput;
  /** What they would like to talk about, if anything. */
  readonly note: string | null;
}

export interface InviteToOneOnOneResult {
  readonly id: string;
}

/**
 * Somebody invites a teammate to a 1:1: they say when it meets and which template its agenda starts
 * from, and may say what they would like to talk about. Nothing is in either person's week until the
 * teammate accepts. Two people keep one 1:1 that is not over at a time.
 */
@Injectable()
export class InviteToOneOnOneUseCase {
  constructor(
    private readonly oneOnOneRepository: OneOnOneRepository,
    private readonly templateCatalog: OneOnOneTemplateCatalogService,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: InviteToOneOnOneInput): Promise<InviteToOneOnOneResult> {
    const now = this.clock.now();
    const oneOnOne = OneOnOne.invite({
      id: this.idGenerator.next(),
      workspaceId: input.workspaceId,
      startedByAccountId: input.startedByAccountId,
      invitedAccountId: input.invitedAccountId,
      schedule: OneOnOneSchedule.plan(input.schedule, now),
      note: input.note,
    });
    const members = await this.workspaceMembershipPort.membersAmong({
      workspaceId: input.workspaceId,
      accountIds: [input.invitedAccountId],
    });
    if (!members.includes(input.invitedAccountId)) {
      throw new OneOnOnePersonNotFoundError();
    }
    await this.templateCatalog.assertChoosable(
      input.workspaceId,
      input.startedByAccountId,
      input.schedule.templateKey,
    );
    await this.unitOfWork.run(
      async () => {
        if (
          await this.oneOnOneRepository.existsOpenBetween(
            input.workspaceId,
            input.startedByAccountId,
            input.invitedAccountId,
            now,
          )
        ) {
          throw new OneOnOneAlreadyExistsError();
        }
        await this.oneOnOneRepository.save(oneOnOne);
      },
      {
        serializeOn: oneOnOnePairKey(
          input.workspaceId,
          input.startedByAccountId,
          input.invitedAccountId,
        ),
      },
    );
    return { id: oneOnOne.snapshot().id };
  }
}
