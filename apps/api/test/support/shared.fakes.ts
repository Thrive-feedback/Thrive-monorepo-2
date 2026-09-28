import { Clock } from '@app/shared/application/clock.port';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';

/**
 * BE_11 R5 — unit tests substitute *ports* and use the real domain objects. These fakes
 * implement the contract honestly rather than recording calls, so a test asserts an
 * outcome (BE_11 R6) instead of asserting that a method was called.
 *
 * These are the shared-kernel fakes: they stand in for ports declared in
 * `src/shared/application/`, so any module's tests may use them without reaching into
 * another module's types. Module-specific fakes live beside the module that owns them.
 */

let sequence = 0;

/** Restarts unseeded ids for each test, so a test's ids never depend on which ran first. */
export function resetIds(): void {
  sequence = 0;
}

/**
 * A valid, deterministic UUIDv7-shaped id. Unique per call within a test run.
 *
 * BE_11 R8 — the ids are fixed, which is what lets a failing assertion print a value a
 * reader can find in the test above it.
 */
export function anId(seed?: number): string {
  const n = (seed ?? (sequence += 1)).toString(16).padStart(12, '0');
  return `0199a000-0000-7000-8000-${n}`;
}

export class FixedClock extends Clock {
  constructor(private readonly instant: Date) {
    super();
  }

  now(): Date {
    return new Date(this.instant.getTime());
  }
}

export class SequenceIdGenerator extends IdGenerator {
  private index = 0;

  constructor(private readonly ids: readonly string[]) {
    super();
  }

  next(): string {
    const id = this.ids[this.index];
    if (id === undefined) {
      throw new Error(`SequenceIdGenerator ran out after ${this.ids.length} ids.`);
    }
    this.index += 1;
    return id;
  }
}

/** Runs the work directly. A unit test has one caller, so there is nothing to serialize. */
export class PassThroughUnitOfWork extends UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}
