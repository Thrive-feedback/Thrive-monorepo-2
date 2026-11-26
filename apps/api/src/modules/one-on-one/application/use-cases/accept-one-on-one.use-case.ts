import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneRepository } from '../../domain/repository/one-on-one-repository.port';
import { OneOnOneNotFoundError } from '../one-on-one.errors';
import { oneOnOneKey } from '../service/one-on-one-keys.service';

export interface AcceptOneOnOneInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
  readonly oneOnOneId: string;
}

/** The person invited to a 1:1 agrees to it, on the schedule they were sent, and it starts to run. */
@Injectable()
export class AcceptOneOnOneUseCase {
  constructor(
    private readonly oneOnOneRepository: OneOnOneRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: AcceptOneOnOneInput): Promise<void> {
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
        oneOnOne.accept(input.accountId, now);
        await this.oneOnOneRepository.save(oneOnOne);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
