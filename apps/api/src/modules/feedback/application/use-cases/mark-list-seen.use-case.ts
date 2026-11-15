import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import { ListSeenRepository } from '../../domain/repository/list-seen-repository.port';
import type { SeenListValue } from '../../domain/value-object/seen-list.vo';

export interface MarkListSeenInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Who opened it: the signed-in caller, always. */
  readonly accountId: string;
  readonly list: SeenListValue;
}

/**
 * The caller opened one list — a kind of their Received, or Shared with me — so what is in it is
 * no longer new: its count goes to nothing, and only what arrives afterwards counts again. Only
 * that list, and only in this Workspace.
 */
@Injectable()
export class MarkListSeenUseCase {
  constructor(
    private readonly listSeenRepository: ListSeenRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: MarkListSeenInput): Promise<void> {
    await this.listSeenRepository.markSeen(
      {
        workspaceId: input.workspaceId,
        accountId: input.accountId,
        list: input.list,
      },
      this.clock.now(),
    );
  }
}
