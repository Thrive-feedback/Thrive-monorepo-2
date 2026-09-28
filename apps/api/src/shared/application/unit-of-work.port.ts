/**
 * Runs a load-decide-save cycle as one unit, so two commands never interleave between
 * reading state and writing it (BE_05 R8). A nested `run` joins the unit already open.
 */
export abstract class UnitOfWork {
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}
