/** One Ask, as stored. Names are Identity's and are added above this port. */
export interface FeedbackRequestAskRow {
  readonly askId: string;
  readonly giverAccountId: string;
  readonly status: string;
}

/** One Feedback Request, as stored. */
export interface FeedbackRequestRow {
  readonly id: string;
  readonly topic: string;
  readonly visibility: string;
  readonly asks: readonly FeedbackRequestAskRow[];
  readonly createdAt: Date;
}

export abstract class FeedbackRequestQuery {
  /**
   * One request of one Workspace with its Asks, or `null`. The Workspace is a required
   * argument, so a read scoped to nothing cannot be written (`BE_21` R4).
   */
  abstract requestInWorkspace(
    workspaceId: string,
    requestId: string,
  ): Promise<FeedbackRequestRow | null>;
}
