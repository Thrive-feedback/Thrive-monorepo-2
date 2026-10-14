import type {
  FeedbackAnswerRow,
  FeedbackAskPageRow,
  FeedbackAskRow,
  FeedbackPageRow,
  FeedbackRequestPageRow,
  FeedbackRequestRow,
  FeedbackRow,
} from '@app/modules/feedback/application/query-port/feedback-request.query-port';
import { FeedbackRequestQuery } from '@app/modules/feedback/application/query-port/feedback-request.query-port';
import type { PageRequest } from '@app/modules/feedback/application/types/feedback-request.types';
import type { Feedback } from '@app/modules/feedback/domain/entity/feedback.entity';
import {
  FeedbackRequest,
  type FeedbackRequestSnapshot,
} from '@app/modules/feedback/domain/entity/feedback-request.entity';
import { AskAlreadyAnsweredError } from '@app/modules/feedback/domain/feedback-request.errors';
import { FeedbackRequestRepository } from '@app/modules/feedback/domain/repository/feedback-request-repository.port';
import type { AskStatusValue } from '@app/modules/feedback/domain/value-object/ask-status.vo';
import { WorkspaceMembershipPort } from '@app/modules/workspace';

/** Which Accounts are Members of which Workspace, as the test sets it up. */
export class FakeWorkspaceMembershipPort extends WorkspaceMembershipPort {
  /** Keyed `workspaceId`, holding the Accounts that are Members there. */
  private readonly members = new Map<string, Set<string>>();

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
    return (
      this.members.get(membership.workspaceId)?.has(membership.accountId) ===
      true
    );
  }
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

  async askFor(
    workspaceId: string,
    giverAccountId: string,
    askId: string,
  ): Promise<FeedbackAskRow | null> {
    return (
      this.asksOf(workspaceId).find(
        (ask) => ask.askId === askId && ask.giverAccountId === giverAccountId,
      ) ?? null
    );
  }

  /**
   * The Feedback rows the test has written, as the `feedback` table holds them: addressed to
   * one Member of one Workspace, with the Topic of the request they answer.
   */
  readonly feedback: (FeedbackRow & {
    readonly workspaceId: string;
    readonly receiverAccountId: string;
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
          row.receiverAccountId === receiverAccountId,
      )
      .sort(newestFirst);
    return { items: pageOf(received, page), total: received.length };
  }

  /** Every Ask of a Workspace, flattened out of the requests holding them, as the join does. */
  private asksOf(
    workspaceId: string,
  ): (FeedbackAskRow & { readonly giverAccountId: string })[] {
    return this.rows
      .filter((row) => row.workspaceId === workspaceId)
      .flatMap((row) =>
        row.asks.map((ask) => ({
          askId: ask.askId,
          giverAccountId: ask.giverAccountId,
          feedbackRequestId: row.id,
          topic: row.topic,
          requesterAccountId: row.requesterAccountId,
          status: ask.status,
          createdAt: row.createdAt,
        })),
      );
  }
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
