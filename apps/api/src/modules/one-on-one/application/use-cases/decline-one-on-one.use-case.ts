import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneRepository } from '../../domain/repository/one-on-one-repository.port';
import { OneOnOneNotFoundError } from '../one-on-one.errors';
import { oneOnOneKey } from '../service/one-on-one-keys.service';

export interface DeclineOneOnOneInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
  readonly oneOnOneId: string;
  /** Why, if they want to say; whoever started it reads it. */
  readonly note: string | null;
}

/**
 * The person a 1:1 was put to turns it down. Nothing reaches either person's week, and whoever
 * started it sees that it was declined (brain ADR-0060 §4).
 */
@Injectable()
export class DeclineOneOnOneUseCase {
  constructor(
    private readonly oneOnOneRepository: OneOnOneRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: DeclineOneOnOneInput): Promise<void> {
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
        oneOnOne.decline(input.accountId, now, input.note);
        await this.oneOnOneRepository.save(oneOnOne);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
