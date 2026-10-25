import { Injectable } from '@nestjs/common';
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
    const page = await this.kudosQuery.publicIn(input.workspaceId, input.page);
    const people = await this.peopleService.peopleIn(
      input.workspaceId,
      page.items.flatMap((kudos) => [
        kudos.giverAccountId,
        ...kudos.recipientAccountIds,
      ]),
    );
    const person = (accountId: string) => ({
      accountId,
      name: people.nameOf(accountId),
      status: people.statusOf(accountId),
    });

    return {
      items: page.items.map((kudos) => ({
        id: kudos.id,
        giver: person(kudos.giverAccountId),
        recipients: kudos.recipientAccountIds.map(person),
        message: kudos.message,
        tags: kudos.tags,
        createdAt: kudos.createdAt,
      })),
      nextAfterId: page.hasMore ? (page.items.at(-1)?.id ?? null) : null,
    };
  }
}
