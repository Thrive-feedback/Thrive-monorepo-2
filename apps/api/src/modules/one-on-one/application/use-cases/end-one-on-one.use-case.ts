import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneRepository } from '../../domain/repository/one-on-one-repository.port';
import { OneOnOneNotFoundError } from '../one-on-one.errors';
import { oneOnOneKey } from '../service/one-on-one-keys.service';
import { OneOnOneMeetingsSoFarService } from '../service/one-on-one-meetings-so-far.service';

export interface EndOneOnOneInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
  readonly oneOnOneId: string;
}

/**
 * Either person ends a running 1:1, with no approval from the other; whoever started one that is
 * still waiting on an answer withdraws it the same way. Its finished meetings and the notes on
 * them stay readable to both (brain ADR-0060 §4).
 */
@Injectable()
export class EndOneOnOneUseCase {
  constructor(
    private readonly oneOnOneRepository: OneOnOneRepository,
    private readonly meetingsSoFar: OneOnOneMeetingsSoFarService,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: EndOneOnOneInput): Promise<void> {
    const now = this.clock.now();
    await this.unitOfWork.run(
      async () => {
        const oneOnOne = await this.oneOnOneRepository.findById(
          input.workspaceId,
          input.oneOnOneId,
        );
        if (!oneOnOne?.isIn(input.accountId)) {
          throw new OneOnOneNotFoundError();
        }
        const meetings = await this.meetingsSoFar.of(
          input.workspaceId,
          input.oneOnOneId,
        );
        oneOnOne.end(input.accountId, now, meetings);
        await this.oneOnOneRepository.save(oneOnOne);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
