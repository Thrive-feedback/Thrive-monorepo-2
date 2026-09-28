import { Injectable } from '@nestjs/common';
import { ActivityQuery } from '../query-port/activity.query-port';
import type {
  ActivityPageRequest,
  ActivityPageView,
} from '../../domain/types/activity.types';

export interface ReadActivityInput extends ActivityPageRequest {
  readonly subjectId: string;
}

/**
 * BE_05 R3 — a query: it answers a question and changes nothing.
 * BE_05 R4 — it reads through a query contract, never the write-side store.
 */
@Injectable()
export class ReadActivityUseCase {
  constructor(private readonly query: ActivityQuery) {}

  async execute(input: ReadActivityInput): Promise<ActivityPageView> {
    const { items, total } = await this.query.pageBySubject(input.subjectId, input);

    // BE_03 R6 — the internal projection is mapped to the published view before it leaves.
    return {
      items: items.map((item) => ({
        id: item.id,
        subjectId: item.subjectId,
        action: item.action,
        detail: item.detail,
        occurredAt: item.occurredAt,
      })),
      total,
    };
  }
}
