/** The numbers drawn beside Waiting for me, each kind of Received, and Shared with me on Home. */
export interface MyCountsRow {
  /** Every Ask still waiting on them. It goes down only when they answer one. */
  readonly waitingAsks: number;
  /** Answers to their requests that came after they last opened their requests. */
  readonly newAnswers: number;
  /** Feedback given to them unasked after they last opened it. */
  readonly newOffered: number;
  /** Kudos naming them after they last opened their Kudos. */
  readonly newKudos: number;
  /** Feedback somebody selected them to read after they last opened Shared with me on Home. */
  readonly newShared: number;
}

export abstract class MyCountsQuery {
  /**
   * What is waiting on one Member in one Workspace and what is new to them there. Both are
   * required arguments, so no count can be read for somebody else or across Workspaces. A list the
   * Member has never opened counts everything in it.
   */
  abstract countsFor(
    workspaceId: string,
    accountId: string,
  ): Promise<MyCountsRow>;
}
