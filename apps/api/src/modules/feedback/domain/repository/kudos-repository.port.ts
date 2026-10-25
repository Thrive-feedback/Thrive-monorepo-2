import type { Kudos } from '../entity/kudos.entity';

/** Kudos, each its own aggregate root. Written once and never changed. */
export abstract class KudosRepository {
  /** Stores a new Kudos with the people it is for and what it names. */
  abstract save(kudos: Kudos): Promise<void>;
}
