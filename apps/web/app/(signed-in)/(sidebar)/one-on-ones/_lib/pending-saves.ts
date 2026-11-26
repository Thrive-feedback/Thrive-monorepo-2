/**
 * The saves a page has sent and not heard back from, so something that must see them landed, such
 * as the summary checked before a meeting is shared, can wait for them first.
 */
export class PendingSaves {
  private readonly pending = new Set<Promise<unknown>>();

  /** Keeps a save until it settles, however it settles. */
  readonly track = (save: Promise<unknown>): void => {
    this.pending.add(save);
    const done = () => {
      this.pending.delete(save);
    };
    save.then(done, done);
  };

  /** Resolves once every save tracked so far has settled. */
  async settle(): Promise<void> {
    await Promise.allSettled([...this.pending]);
  }
}
