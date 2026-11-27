import { Clock } from '@app/shared/application/clock.port';

/**
 * The time as the scenarios run: the real time, until a scenario says which day it is (as a 1:1's
 * missed meeting needs days to pass). Each scenario starts on the real time again.
 */
export class ScenarioClock extends Clock {
  private fixed: Date | null = null;

  now(): Date {
    return this.fixed ?? new Date();
  }

  /** From now on, every reading is `instant`. */
  set(instant: Date): void {
    this.fixed = instant;
  }

  reset(): void {
    this.fixed = null;
  }
}
