/**
 * Reading the current time is a dependency on the outside world, so the layer that needs
 * it declares the contract and infrastructure supplies it.
 *
 * An abstract class rather than an interface because it has to survive compilation as a
 * runtime injection token, and an interface does not.
 */
export abstract class Clock {
  /** The current instant, always UTC. */
  abstract now(): Date;
}
