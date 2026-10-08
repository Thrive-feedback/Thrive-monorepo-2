export interface UnitOfWorkOptions {
  /**
   * Runs no two units of work with the same key at once: a second waits until the first
   * commits or rolls back. For a check-then-write that two requests from one person can race,
   * such as "is this Account in a Workspace yet?" before creating one.
   */
  readonly serializeOn?: string;
}

/**
 * One transaction around a use case's whole write (`BE_05` R8). Every repository and query
 * that runs inside `work` joins it, without the use case or the domain seeing the driver.
 *
 * Opened only by a use case, and only once: a unit of work inside another is refused,
 * because only the outermost knows what "the whole operation" means.
 */
export abstract class UnitOfWork {
  abstract run<T>(
    work: () => Promise<T>,
    options?: UnitOfWorkOptions,
  ): Promise<T>;
}
