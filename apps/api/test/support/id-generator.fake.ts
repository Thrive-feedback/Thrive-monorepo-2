import { IdGenerator } from '@app/shared/application/id-generator.port';

/** Hands out the ids it was given, in order, so a test can assert the one it expects. */
export class FakeIdGenerator extends IdGenerator {
  private readonly ids: string[];

  constructor(...ids: string[]) {
    super();
    this.ids = ids;
  }

  next(): string {
    const id = this.ids.shift();
    if (id === undefined) {
      throw new Error('FakeIdGenerator ran out of ids.');
    }
    return id;
  }
}
