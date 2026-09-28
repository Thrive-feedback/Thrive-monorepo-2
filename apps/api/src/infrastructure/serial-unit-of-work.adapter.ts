import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';

/**
 * The file store's stand-in for a transaction: every unit runs one after another in this
 * process. A store with real transactions replaces this adapter, not its callers.
 */
@Injectable()
export class SerialUnitOfWork extends UnitOfWork {
  private tail: Promise<unknown> = Promise.resolve();
  private readonly inside = new AsyncLocalStorage<true>();

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.inside.getStore() === true) {
      return work();
    }

    const result = this.tail.then(() => this.inside.run(true, work));
    // A failed unit belongs to its own caller; the next unit still runs.
    this.tail = result.catch(() => undefined);
    return result;
  }
}
