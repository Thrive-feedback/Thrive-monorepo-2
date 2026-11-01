import { Injectable } from '@nestjs/common';
import { KudosQuery } from '../query-port/kudos.query-port';
import type { KudosMonthsView } from '../types/kudos.types';

export interface ListKudosMonthsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
}

/**
 * A query: which months of this Workspace hold a Kudos, and how many, which is what the Kudos board
 * filters by and counts its pages from (ADR 0076).
 *
 * **It takes no account id, which is why the guard on its route is load-bearing**, as on the list of
 * Kudos itself: every Member reads every Kudos.
 */
@Injectable()
export class ListKudosMonthsUseCase {
  constructor(private readonly kudosQuery: KudosQuery) {}

  async execute(input: ListKudosMonthsInput): Promise<KudosMonthsView> {
    const months = await this.kudosQuery.monthsIn(input.workspaceId);
    return {
      total: months.reduce((total, { count }) => total + count, 0),
      months,
    };
  }
}
