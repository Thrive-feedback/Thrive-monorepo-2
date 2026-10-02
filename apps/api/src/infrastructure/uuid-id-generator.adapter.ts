import { IdGenerator } from '@app/shared/application/id-generator.port';
import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

/** The outward end of {@link IdGenerator}. */
@Injectable()
export class UuidIdGenerator extends IdGenerator {
  next(): string {
    return uuidv7();
  }
}
