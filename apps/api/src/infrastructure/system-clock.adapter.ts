import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';

/** The outward end of {@link Clock}: the real system clock. */
@Injectable()
export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
