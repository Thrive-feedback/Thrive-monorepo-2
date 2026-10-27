import { AccountSummaryPort } from '@app/modules/identity';
import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { Injectable } from '@nestjs/common';
import type { People } from '../types/feedback-request.types';

/**
 * The people named on one page of a Workspace: the name each introduced themselves with, their
 * Google photo, and whether they are still active there or were Deactivated. The photo comes with
 * the name from the same lookup, so showing faces costs no call of its own.
 *
 * Every read in this module shows people by name, and every one of them had the same shape of
 * bug available to it: a person resolved per row rather than per page. Asking once for the whole
 * page keeps the number of calls independent of the number of rows (`BE_06` R9), so a page of
 * twenty costs one call to Identity and one to Workspace however many Members each row names.
 */
@Injectable()
export class PeopleService {
  constructor(
    private readonly accountSummaryPort: AccountSummaryPort,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
  ) {}

  /**
   * One lookup for every Account named, de-duplicated. A missing Account — deleted mid-read — and
   * one that has not introduced itself both have a `null` name, because neither has a name to
   * show, and the screen says the same thing about both. Anyone Workspace does not report as
   * Deactivated reads as active, a deleted Account included.
   */
  async peopleIn(
    workspaceId: string,
    accountIds: readonly string[],
  ): Promise<People> {
    const unique = [...new Set(accountIds)];
    const [summaries, deactivated] = await Promise.all([
      this.accountSummaryPort.summariesOf(unique),
      this.workspaceMembershipPort.deactivatedAmong({
        workspaceId,
        accountIds: unique,
      }),
    ]);
    const names = new Map(
      summaries.map((summary) => [summary.accountId, summary.fullName]),
    );
    const photos = new Map(
      summaries.map((summary) => [summary.accountId, summary.photoUrl]),
    );
    const inactive = new Set(deactivated);
    const people: People = {
      nameOf: (accountId) => names.get(accountId) ?? null,
      photoOf: (accountId) => photos.get(accountId) ?? null,
      statusOf: (accountId) =>
        inactive.has(accountId) ? 'DEACTIVATED' : 'ACTIVE',
      personOf: (accountId) => ({
        accountId,
        name: people.nameOf(accountId),
        photoUrl: people.photoOf(accountId),
        status: people.statusOf(accountId),
      }),
    };
    return people;
  }
}
