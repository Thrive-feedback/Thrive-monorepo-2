import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneNotFoundError } from '../one-on-one.errors';
import { OneOnOneQuery } from '../query-port/one-on-one.query-port';
import { OneOnOneViewService } from '../service/one-on-one-view.service';
import type { OneOnOneView } from '../types/one-on-one.types';

export interface GetOneOnOneInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
  readonly oneOnOneId: string;
}

/** A query: one 1:1 the caller is in, in any state. Anybody else is told it does not exist. */
@Injectable()
export class GetOneOnOneUseCase {
  constructor(
    private readonly oneOnOneQuery: OneOnOneQuery,
    private readonly oneOnOneViewService: OneOnOneViewService,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetOneOnOneInput): Promise<OneOnOneView> {
    const row = await this.oneOnOneQuery.findFor(
      input.workspaceId,
      input.oneOnOneId,
      input.accountId,
    );
    const view =
      row === null
        ? null
        : this.oneOnOneViewService.toView(
            row,
            input.accountId,
            this.clock.now(),
          );
    if (view === null) {
      throw new OneOnOneNotFoundError();
    }
    return view;
  }
}
