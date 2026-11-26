import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneQuery } from '../query-port/one-on-one.query-port';
import { OneOnOneViewService } from '../service/one-on-one-view.service';
import type {
  OneOnOneCursorPageRequest,
  OneOnOneView,
  OneOnOneViewPage,
} from '../types/one-on-one.types';

export interface ListMyOneOnOnesInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: only their own 1:1s are ever listed. */
  readonly accountId: string;
  readonly page: OneOnOneCursorPageRequest;
}

/** How long a 1:1 that was turned down stays listed for whoever started it. */
const DECLINED_LISTED_FOR_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * A query: the 1:1s the caller is in — whoever sent the invitation, running or waiting on an
 * answer — each with when it next meets. One they started that was turned down stays for two weeks,
 * so they learn the answer, then drops off.
 */
@Injectable()
export class ListMyOneOnOnesUseCase {
  constructor(
    private readonly oneOnOneQuery: OneOnOneQuery,
    private readonly oneOnOneViewService: OneOnOneViewService,
    private readonly clock: Clock,
  ) {}

  async execute(input: ListMyOneOnOnesInput): Promise<OneOnOneViewPage> {
    const now = this.clock.now();
    const page = await this.oneOnOneQuery.listFor(
      input.workspaceId,
      input.accountId,
      input.page,
      new Date(now.getTime() - DECLINED_LISTED_FOR_MS),
    );
    return {
      items: page.items
        .map((row) =>
          this.oneOnOneViewService.toView(row, input.accountId, now),
        )
        .filter((view): view is OneOnOneView => view !== null),
      nextAfterId: page.nextAfterId,
    };
  }
}
