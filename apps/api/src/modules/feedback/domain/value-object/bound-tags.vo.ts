/** A Workspace Goal some text named, as it was when the text was sent. */
export interface BoundWorkspaceGoal {
  readonly workspaceGoalId: string;
  /** The Admin's spelling, without the `#`. */
  readonly name: string;
}

/** A Member some text mentioned, as they were when the text was sent. */
export interface BoundMention {
  readonly accountId: string;
  readonly slug: string;
  /** The name they went by then, kept so a read never asks who they are. */
  readonly displayName: string;
}

/**
 * The Workspace Goals and Members some sent text is bound to, each once. Bound when it is sent
 * and never changed: hiding a Workspace Goal, or a Member changing their name, leaves it alone.
 */
export class BoundTags {
  private constructor(
    private readonly boundWorkspaceGoals: readonly BoundWorkspaceGoal[],
    private readonly boundMentions: readonly BoundMention[],
  ) {}

  static none(): BoundTags {
    return new BoundTags([], []);
  }

  static of(tags: {
    readonly workspaceGoals: readonly BoundWorkspaceGoal[];
    readonly mentions: readonly BoundMention[];
  }): BoundTags {
    return new BoundTags(
      onceEach(tags.workspaceGoals, (goal) => goal.workspaceGoalId),
      onceEach(tags.mentions, (mention) => mention.accountId),
    );
  }

  workspaceGoals(): readonly BoundWorkspaceGoal[] {
    return this.boundWorkspaceGoals;
  }

  mentions(): readonly BoundMention[] {
    return this.boundMentions;
  }
}

function onceEach<T>(items: readonly T[], idOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = idOf(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
