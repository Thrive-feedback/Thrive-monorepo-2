import {
  UnitOfWork,
  type UnitOfWorkOptions,
} from '@app/shared/application/unit-of-work.port';

/**
 * Runs the work straight away and records each unit opened, so a test can assert that a
 * write was wrapped, and on which key it was serialized. Transactions themselves are the
 * integration suite's to prove.
 */
export class FakeUnitOfWork extends UnitOfWork {
  readonly opened: UnitOfWorkOptions[] = [];

  async run<T>(
    work: () => Promise<T>,
    options: UnitOfWorkOptions = {},
  ): Promise<T> {
    this.opened.push(options);
    return work();
  }
}
