import type { FeedbackRequestRow } from '@app/modules/feedback/application/query-port/feedback-request.query-port';
import { FeedbackRequestQuery } from '@app/modules/feedback/application/query-port/feedback-request.query-port';
import {
  FeedbackRequest,
  type FeedbackRequestSnapshot,
} from '@app/modules/feedback/domain/entity/feedback-request.entity';
import { FeedbackRequestRepository } from '@app/modules/feedback/domain/repository/feedback-request-repository.port';
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
}

export class FakeFeedbackRequestQuery extends FeedbackRequestQuery {
  readonly rows: (FeedbackRequestRow & { readonly workspaceId: string })[] = [];

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
}
