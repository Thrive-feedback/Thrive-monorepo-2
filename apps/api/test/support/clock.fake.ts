import { Clock } from '@app/shared/application/clock.port';

/** Always the instant it was given, so a test controls "now". */
export class FakeClock extends Clock {
  constructor(private readonly instant: Date) {
    super();
  }

  now(): Date {
    return this.instant;
  }
}
