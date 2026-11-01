import { Injectable } from '@nestjs/common';
import { KudosMonth } from '../../domain/value-object/kudos-month.vo';
import { KudosQuery } from '../query-port/kudos.query-port';
import { PeopleService } from '../service/people.service';
import type {
  CursorPageRequest,
  WorkspaceKudosView,
} from '../types/kudos.types';

export interface ListWorkspaceKudosInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  readonly page: CursorPageRequest;
  /** One month, `YYYY-MM`, or `null` for every Kudos. */
  readonly month: string | null;
}

/**
 * A query: the Kudos of this Workspace, newest first, with everybody they name by name.
 *
 * **It takes no account id, which is why the guard on its route is load-bearing**, as on the
 * Workspace feed: every Member reads every Kudos, and what makes the caller a Member is
 * `WorkspaceMemberGuard` having already said so.
 */
@Injectable()
export class ListWorkspaceKudosUseCase {
  constructor(
    private readonly kudosQuery: KudosQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: ListWorkspaceKudosInput): Promise<WorkspaceKudosView> {
    const page = await this.kudosQuery.publicIn(
      input.workspaceId,
      input.page,
      input.month === null ? null : KudosMonth.of(input.month).range(),
    );
    const people = await this.peopleService.peopleIn(
      input.workspaceId,
      page.items.flatMap((kudos) => [
        kudos.giverAccountId,
        ...kudos.recipientAccountIds,
      ]),
    );
    return {
      items: page.items.map((kudos) => ({
        id: kudos.id,
        giver: people.personOf(kudos.giverAccountId),
        recipients: kudos.recipientAccountIds.map(people.personOf),
        message: kudos.message,
        tags: kudos.tags,
        card: kudos.card,
        createdAt: kudos.createdAt,
      })),
      nextAfterId: page.hasMore ? (page.items.at(-1)?.id ?? null) : null,
    };
  }
}
