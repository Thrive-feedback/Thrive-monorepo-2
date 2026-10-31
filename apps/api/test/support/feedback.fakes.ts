import type {
  AnsweredRequestRow,
  FeedbackAnswerRow,
  FeedbackAskPageRow,
  FeedbackAskWithVisibilityRow,
  FeedbackPageRow,
  FeedbackRequestPageRow,
  FeedbackRequestRow,
  FeedbackRow,
  FeedbackWithPeoplePageRow,
  FeedbackWithPeopleRow,
  FeedbackWithVisibilityRow,
  FeedItemAskRow,
  FeedItemPageRow,
  OpenedRequestRow,
  WaitingAskPageRow,
  WorkspaceFeedPageRow,
} from '@app/modules/feedback/application/query-port/feedback-request.query-port';
import { FeedbackRequestQuery } from '@app/modules/feedback/application/query-port/feedback-request.query-port';
import {
  type KudosPageRow,
  KudosQuery,
  type KudosRow,
} from '@app/modules/feedback/application/query-port/kudos.query-port';
import { TagsService } from '@app/modules/feedback/application/service/tags.service';
import type {
  FeedItemShow,
  PageRequest,
  WaitingAskSort,
} from '@app/modules/feedback/application/types/feedback-request.types';
import type { CursorPageRequest } from '@app/modules/feedback/application/types/kudos.types';
import type { Feedback } from '@app/modules/feedback/domain/entity/feedback.entity';
import {
  FeedbackRequest,
  type FeedbackRequestSnapshot,
} from '@app/modules/feedback/domain/entity/feedback-request.entity';
import type {
  Kudos,
  KudosSnapshot,
} from '@app/modules/feedback/domain/entity/kudos.entity';
import { AskAlreadyAnsweredError } from '@app/modules/feedback/domain/feedback-request.errors';
import { FeedbackRepository } from '@app/modules/feedback/domain/repository/feedback-repository.port';
import { FeedbackRequestRepository } from '@app/modules/feedback/domain/repository/feedback-request-repository.port';
import { KudosRepository } from '@app/modules/feedback/domain/repository/kudos-repository.port';
import type { AskStatusValue } from '@app/modules/feedback/domain/value-object/ask-status.vo';
import {
  VISIBILITIES,
  type VisibilityValue,
} from '@app/modules/feedback/domain/value-object/visibility.vo';
import { type AccountBySlug, AccountBySlugPort } from '@app/modules/identity';
import { WorkspaceMembershipPort } from '@app/modules/workspace';
import {
  type ActiveWorkspaceGoal,
  ActiveWorkspaceGoalPort,
} from '@app/modules/workspace-goal';

/** Which Accounts are Members of which Workspace, and which were Deactivated, as the test sets it up. */
export class FakeWorkspaceMembershipPort extends WorkspaceMembershipPort {
  /** Keyed `workspaceId`, holding the Accounts that are Members there. */
  private readonly members = new Map<string, Set<string>>();
  /** Keyed `workspaceId`, holding the Accounts Deactivated there. */
  private readonly deactivated = new Map<string, Set<string>>();
  /** Keyed `workspaceId`, holding the Members who are Admins there. */
  private readonly admins = new Map<string, Set<string>>();

  /** Makes these Accounts Members of the Workspace and Admins of it. */
  withAdmins(workspaceId: string, ...accountIds: string[]): this {
    const held = this.admins.get(workspaceId) ?? new Set<string>();
    for (const accountId of accountIds) {
      held.add(accountId);
    }
    this.admins.set(workspaceId, held);
    return this.with(workspaceId, ...accountIds);
  }

  withDeactivated(workspaceId: string, ...accountIds: string[]): this {
    const held = this.deactivated.get(workspaceId) ?? new Set<string>();
    for (const accountId of accountIds) {
      held.add(accountId);
    }
    this.deactivated.set(workspaceId, held);
    return this;
  }

  /** One entry per `deactivatedAmong` call, holding what was asked: how a test sees an N+1 read. */
  readonly deactivatedCalls: (readonly string[])[] = [];

  with(workspaceId: string, ...accountIds: string[]): this {
    const held = this.members.get(workspaceId) ?? new Set<string>();
    for (const accountId of accountIds) {
      held.add(accountId);
    }
    this.members.set(workspaceId, held);
    return this;
  }

  async isMemberOf(membership: {
    readonly workspaceId: string;
    readonly accountId: string;
  }): Promise<boolean> {
    return this.isActive(membership.workspaceId, membership.accountId);
  }

  async isAdminOf(membership: {
    readonly workspaceId: string;
    readonly accountId: string;
  }): Promise<boolean> {
    return (
      this.admins.get(membership.workspaceId)?.has(membership.accountId) ===
      true
    );
  }

  async membersAmong(members: {
    readonly workspaceId: string;
    readonly accountIds: readonly string[];
  }): Promise<readonly string[]> {
    return members.accountIds.filter((accountId) =>
      this.isActive(members.workspaceId, accountId),
    );
  }

  /**
   * **Active** membership, which is what the real port answers and what this fake used not to.
   * `MembershipQuery.membershipInWorkspace` filters `deactivatedAt: null` (ADR 0047), so a
   * Deactivated person is not a Member to `isMemberOf` or `membersAmong` — only to
   * `deactivatedAmong`, which is asked for them by name. A fake that answered otherwise would
   * let a test assert behaviour the application cannot produce.
   */
  private isActive(workspaceId: string, accountId: string): boolean {
    return (
      this.members.get(workspaceId)?.has(accountId) === true &&
      this.deactivated.get(workspaceId)?.has(accountId) !== true
    );
  }

  async deactivatedAmong(members: {
    readonly workspaceId: string;
    readonly accountIds: readonly string[];
  }): Promise<readonly string[]> {
    this.deactivatedCalls.push([...members.accountIds]);
    const held = this.deactivated.get(members.workspaceId);
    return members.accountIds.filter((accountId) => held?.has(accountId));
  }
}

/** The active Workspace Goals of each Workspace, as the test sets them up. */
export class FakeActiveWorkspaceGoalPort extends ActiveWorkspaceGoalPort {
  private readonly active = new Map<string, ActiveWorkspaceGoal[]>();
  /** One entry per call, holding the names asked: how a test sees nothing was asked. */
  readonly calls: (readonly string[])[] = [];

  with(workspaceId: string, ...workspaceGoals: ActiveWorkspaceGoal[]): this {
    this.active.set(workspaceId, [
      ...(this.active.get(workspaceId) ?? []),
      ...workspaceGoals,
    ]);
    return this;
  }

  async activeAmong(query: {
    readonly workspaceId: string;
    readonly names: readonly string[];
  }): Promise<ActiveWorkspaceGoal[]> {
    this.calls.push([...query.names]);
    const keys = query.names.map((name) => name.toLowerCase());
    return (this.active.get(query.workspaceId) ?? []).filter((workspaceGoal) =>
      keys.includes(workspaceGoal.name.toLowerCase()),
    );
  }
}

/** The Accounts whose Profiles hold a slug, as the test sets them up. */
export class FakeAccountBySlugPort extends AccountBySlugPort {
  private readonly accounts: AccountBySlug[] = [];
  /** One entry per call, holding the slugs asked. */
  readonly calls: (readonly string[])[] = [];

  with(...accounts: AccountBySlug[]): this {
    this.accounts.push(...accounts);
    return this;
  }

  async accountsWithSlugs(slugs: readonly string[]): Promise<AccountBySlug[]> {
    this.calls.push([...slugs]);
    return this.accounts.filter((account) => slugs.includes(account.slug));
  }
}

/**
 * Binds text as a Workspace would whose one active Workspace Goal is `#ownership` and whose
 * Member `account-cara` goes by `@cara`.
 */
export function aTagsService(workspaceId: string): TagsService {
  return new TagsService(
    new FakeActiveWorkspaceGoalPort().with(workspaceId, {
      id: 'goal-ownership',
      name: 'ownership',
    }),
    new FakeAccountBySlugPort().with({
      accountId: 'account-cara',
      slug: 'cara',
      displayName: 'Cara',
    }),
    new FakeWorkspaceMembershipPort().with(workspaceId, 'account-cara'),
  );
}

/** Feedback Requests held in memory, scoped by Workspace the way the real reads are. */
export class FakeFeedbackRequestRepository extends FeedbackRequestRepository {
  readonly saved: FeedbackRequestSnapshot[] = [];

  async save(request: FeedbackRequest): Promise<void> {
    this.saved.push(request.snapshot());
  }

  async findInWorkspace(
    workspaceId: string,
    requestId: string,
  ): Promise<FeedbackRequest | null> {
    const found = this.saved.find(
      (request) =>
        request.id === requestId && request.workspaceId === workspaceId,
    );
    return found ? FeedbackRequest.restore(found) : null;
  }

  async findByAskOfGiver(
    workspaceId: string,
    askId: string,
    giverAccountId: string,
  ): Promise<FeedbackRequest | null> {
    const found = this.saved.find(
      (request) =>
        request.workspaceId === workspaceId &&
        request.asks.some(
          (ask) => ask.id === askId && ask.giverAccountId === giverAccountId,
        ),
    );
    return found ? FeedbackRequest.restore(found) : null;
  }

  readonly answers: ReturnType<Feedback['snapshot']>[] = [];

  /**
   * Like the real store: the Ask it answers has to still be Pending, and one Ask can hold one
   * answer — the two defences the repository turns into the same refusal.
   */
  async saveAnswer(
    request: FeedbackRequest,
    feedback: Feedback,
  ): Promise<void> {
    const answer = feedback.snapshot();
    const stored = this.saved.findIndex(
      (saved) => saved.id === answer.feedbackRequestId,
    );
    const before = this.saved[stored];
    const asked = before?.asks.find((ask) => ask.id === answer.feedbackAskId);
    if (!before || !asked || asked.status !== 'PENDING') {
      throw new AskAlreadyAnsweredError();
    }
    if (
      this.answers.some((held) => held.feedbackAskId === answer.feedbackAskId)
    ) {
      throw new AskAlreadyAnsweredError();
    }
    this.saved[stored] = request.snapshot();
    this.answers.push(answer);
  }
}

export class FakeFeedbackRepository extends FeedbackRepository {
  readonly saved: ReturnType<Feedback['snapshot']>[] = [];

  async save(feedback: Feedback): Promise<void> {
    this.saved.push(feedback.snapshot());
  }
}

export class FakeFeedbackRequestQuery extends FeedbackRequestQuery {
  readonly rows: (FeedbackRequestRow & { readonly workspaceId: string })[] = [];

  readonly answers: FeedbackAnswerRow[] = [];

  async answersInRequest(
    workspaceId: string,
    requestId: string,
  ): Promise<readonly FeedbackAnswerRow[]> {
    const request = this.rows.find(
      (row) => row.id === requestId && row.workspaceId === workspaceId,
    );
    if (!request) {
      return [];
    }
    const askIds = new Set(request.asks.map((ask) => ask.askId));
    return this.answers.filter((answer) => askIds.has(answer.askId));
  }

  async requestInWorkspace(
    workspaceId: string,
    requestId: string,
  ): Promise<FeedbackRequestRow | null> {
    return (
      this.rows.find(
        (row) => row.id === requestId && row.workspaceId === workspaceId,
      ) ?? null
    );
  }

  async sentInWorkspace(
    workspaceId: string,
    requesterAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackRequestPageRow> {
    const sent = this.rows
      .filter(
        (row) =>
          row.workspaceId === workspaceId &&
          row.requesterAccountId === requesterAccountId,
      )
      .sort(newestFirst);
    return { items: pageOf(sent, page), total: sent.length };
  }

  async asksFor(
    workspaceId: string,
    giverAccountId: string,
    status: AskStatusValue,
    page: PageRequest,
  ): Promise<FeedbackAskPageRow> {
    const waiting = this.asksOf(workspaceId)
      .filter(
        (ask) => ask.giverAccountId === giverAccountId && ask.status === status,
      )
      .sort(newestFirst);
    return { items: pageOf(waiting, page), total: waiting.length };
  }

  async waitingAsksFor(
    workspaceId: string,
    giverAccountId: string,
    sort: WaitingAskSort,
    page: CursorPageRequest,
  ): Promise<WaitingAskPageRow> {
    const theirs = this.asksOf(workspaceId)
      .filter((ask) => ask.giverAccountId === giverAccountId)
      .sort(newestFirst);
    if (sort === 'OLDEST') {
      theirs.reverse();
    }
    // The Ask the cursor names is found among all of them: it may have been answered since.
    const after =
      page.afterId === null
        ? theirs
        : theirs.slice(
            theirs.findIndex((ask) => ask.askId === page.afterId) + 1,
          );
    const waiting = after.filter((ask) => ask.status === 'PENDING');
    return {
      items: waiting.slice(0, page.limit),
      hasMore: waiting.length > page.limit,
    };
  }

  /** Single pieces of Feedback with the Visibility of their request, as the test writes them. */
  readonly feedbackWithVisibility: (FeedbackWithVisibilityRow & {
    readonly workspaceId: string;
  })[] = [];

  async feedbackInWorkspace(
    workspaceId: string,
    feedbackId: string,
  ): Promise<FeedbackWithVisibilityRow | null> {
    return (
      this.feedbackWithVisibility.find(
        (row) => row.id === feedbackId && row.workspaceId === workspaceId,
      ) ?? null
    );
  }

  readonly openedRequests: (OpenedRequestRow & {
    readonly id: string;
    readonly workspaceId: string;
  })[] = [];

  async openedRequest(
    workspaceId: string,
    requestId: string,
  ): Promise<OpenedRequestRow | null> {
    return (
      this.openedRequests.find(
        (row) => row.id === requestId && row.workspaceId === workspaceId,
      ) ?? null
    );
  }

  async sharedWith(
    workspaceId: string,
    readerAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackWithPeoplePageRow> {
    const shared = this.feedbackWithVisibility
      .filter(
        (row) =>
          row.workspaceId === workspaceId &&
          row.visibility === 'SELECTED_PEOPLE' &&
          row.selectedAccountIds.includes(readerAccountId),
      )
      .sort(newestFirst)
      .map(withoutVisibility);
    return { items: pageOf(shared, page), total: shared.length };
  }

  async publicIn(
    workspaceId: string,
    page: PageRequest,
  ): Promise<WorkspaceFeedPageRow> {
    const feed = this.feedbackWithVisibility
      .filter(
        (row) =>
          row.workspaceId === workspaceId && row.visibility === 'EVERYONE',
      )
      .sort(newestFirst)
      .map((row) => ({
        ...withoutVisibility(row),
        request: this.answeredRequestOf(workspaceId, row.feedbackRequestId),
      }));
    return { items: pageOf(feed, page), total: feed.length };
  }

  async feedItemsFor(
    workspaceId: string,
    readerAccountId: string,
    show: FeedItemShow,
    page: CursorPageRequest,
  ): Promise<FeedItemPageRow> {
    const read = this.feedbackWithVisibility
      .filter((row) => {
        const everyone =
          row.visibility === 'EVERYONE' && show !== 'SHARED_WITH_ME';
        const selected =
          row.visibility === 'SELECTED_PEOPLE' &&
          show !== 'EVERYONE' &&
          row.selectedAccountIds.includes(readerAccountId);
        return row.workspaceId === workspaceId && (everyone || selected);
      })
      .sort(newestFirst);
    const start =
      page.afterId === null
        ? 0
        : read.findIndex((row) => row.id === page.afterId) + 1;
    const rest = read.slice(start);
    return {
      items: rest.slice(0, page.limit).map((row) => {
        const request = this.answeredRequestOf(
          workspaceId,
          row.feedbackRequestId,
        );
        return {
          ...withoutVisibility(row),
          visibility:
            row.visibility === 'EVERYONE' ? 'EVERYONE' : 'SELECTED_PEOPLE',
          request: request && {
            message: request.message,
            tags: request.tags,
            requesterAccountId: request.requesterAccountId,
            asks: this.asksWithAnswersOf(row.feedbackRequestId),
          },
        };
      }),
      hasMore: rest.length > page.limit,
    };
  }

  /** Every Ask of a request with what was written for it, as Home's join reads them. */
  private asksWithAnswersOf(
    feedbackRequestId: string | null,
  ): FeedItemAskRow[] {
    const request = this.rows.find((row) => row.id === feedbackRequestId);
    return (request?.asks ?? []).map((ask) => {
      const answer = this.answers.find((held) => held.askId === ask.askId);
      return {
        giverAccountId: ask.giverAccountId,
        status: ask.status,
        answer: answer
          ? {
              message: answer.message,
              tags: answer.tags,
              answeredAt: answer.answeredAt,
            }
          : null,
      };
    });
  }

  /** The request an answer responds to, as the feed's join reads it through the Ask. */
  private answeredRequestOf(
    workspaceId: string,
    feedbackRequestId: string | null,
  ): AnsweredRequestRow | null {
    const request = this.rows.find(
      (row) => row.id === feedbackRequestId && row.workspaceId === workspaceId,
    );
    return request
      ? {
          message: request.message,
          tags: request.tags,
          requesterAccountId: request.requesterAccountId,
          askedAccountIds: request.asks.map((ask) => ask.giverAccountId),
        }
      : null;
  }

  async askFor(
    workspaceId: string,
    giverAccountId: string,
    askId: string,
  ): Promise<FeedbackAskWithVisibilityRow | null> {
    return (
      this.asksOf(workspaceId).find(
        (ask) => ask.askId === askId && ask.giverAccountId === giverAccountId,
      ) ?? null
    );
  }

  /**
   * The Feedback rows the test has written, as the `feedback` table holds them: addressed to
   * one or more Members of one Workspace.
   */
  readonly feedback: (FeedbackRow & {
    readonly workspaceId: string;
  })[] = [];

  async receivedBy(
    workspaceId: string,
    receiverAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackPageRow> {
    const received = this.feedback
      .filter(
        (row) =>
          row.workspaceId === workspaceId &&
          row.receiverAccountIds.includes(receiverAccountId),
      )
      .sort(newestFirst);
    return { items: pageOf(received, page), total: received.length };
  }

  /** Every Ask of a Workspace, flattened out of the requests holding them, as the join does. */
  private asksOf(
    workspaceId: string,
  ): (FeedbackAskWithVisibilityRow & { readonly giverAccountId: string })[] {
    return this.rows
      .filter((row) => row.workspaceId === workspaceId)
      .flatMap((row) =>
        row.asks.map((ask) => ({
          askId: ask.askId,
          giverAccountId: ask.giverAccountId,
          feedbackRequestId: row.id,
          message: row.message,
          tags: row.tags,
          requesterAccountId: row.requesterAccountId,
          status: ask.status,
          createdAt: row.createdAt,
          visibility: storedVisibility(row.visibility),
          postcard: row.postcard,
        })),
      );
  }
}

/** A request row's Visibility as the store's enum column holds it, which is one of the three. */
function storedVisibility(raw: string): VisibilityValue {
  const value = VISIBILITIES.find((visibility) => visibility === raw);
  if (!value) {
    throw new Error(`A request row holds an unknown Visibility: ${raw}.`);
  }
  return value;
}

/** Bound to nothing: text that named no Workspace Goal and nobody. */
export const NO_TAGS = { workspaceGoals: [], mentions: [] } as const;

/** The real list reads hand back no Visibility: they applied it (ADR 0044). */
function withoutVisibility(
  row: FeedbackWithVisibilityRow,
): FeedbackWithPeopleRow {
  return {
    id: row.id,
    origin: row.origin,
    feedbackRequestId: row.feedbackRequestId,
    giverAccountId: row.giverAccountId,
    receiverAccountIds: row.receiverAccountIds,
    message: row.message,
    tags: row.tags,
    createdAt: row.createdAt,
  };
}

function newestFirst(
  left: { readonly createdAt: Date },
  right: { readonly createdAt: Date },
): number {
  return right.createdAt.getTime() - left.createdAt.getTime();
}

function pageOf<T>(rows: readonly T[], page: PageRequest): T[] {
  const from = (page.page - 1) * page.pageSize;
  return rows.slice(from, from + page.pageSize);
}

export class FakeKudosRepository extends KudosRepository {
  readonly saved: KudosSnapshot[] = [];

  async save(kudos: Kudos): Promise<void> {
    this.saved.push(kudos.snapshot());
  }
}

/** Kudos held in memory, paged newest first by the id cursor the real read uses. */
export class FakeKudosQuery extends KudosQuery {
  readonly rows: (KudosRow & { readonly workspaceId: string })[] = [];

  async publicIn(
    workspaceId: string,
    page: CursorPageRequest,
  ): Promise<KudosPageRow> {
    const newestFirst = this.rows
      .filter((row) => row.workspaceId === workspaceId)
      .sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime() ||
          b.id.localeCompare(a.id),
      );
    const start =
      page.afterId === null
        ? 0
        : newestFirst.findIndex((row) => row.id === page.afterId) + 1;
    const rest =
      start === 0 && page.afterId !== null ? [] : newestFirst.slice(start);
    return {
      items: rest.slice(0, page.limit),
      hasMore: rest.length > page.limit,
    };
  }
}
