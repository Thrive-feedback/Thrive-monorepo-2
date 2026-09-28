import type { DomainError } from '@app/shared/errors/coded-error';
import { TodoItemAlreadyCompletedError, TodoItemNotCompletedError } from '../todo.errors';

export type ItemStatusName = 'open' | 'completed';

/**
 * BE_04 R6 — status is a value object with *declared* transitions, not a string.
 * Because the legal moves live here, no use case ever compares a status string, and
 * adding a third state means changing one table rather than hunting for comparisons.
 */
export class ItemStatus {
  private static readonly TRANSITIONS: Readonly<Record<ItemStatusName, readonly ItemStatusName[]>> = {
    open: ['completed'],
    completed: ['open'],
  };

  private constructor(private readonly value: ItemStatusName) {}

  static open(): ItemStatus {
    return new ItemStatus('open');
  }

  static completed(): ItemStatus {
    return new ItemStatus('completed');
  }

  /** Rebuilds a status from storage. The mapper is the only caller (BE_06 R4). */
  static fromName(name: ItemStatusName): ItemStatus {
    return new ItemStatus(name);
  }

  get isCompleted(): boolean {
    return this.value === 'completed';
  }

  /**
   * BE_04 R7 — refuses the illegal move by naming the exact condition that failed,
   * rather than returning a boolean the caller might ignore.
   */
  complete(): ItemStatus {
    return this.transitionTo('completed', () => new TodoItemAlreadyCompletedError());
  }

  reopen(): ItemStatus {
    return this.transitionTo('open', () => new TodoItemNotCompletedError());
  }

  equals(other: ItemStatus): boolean {
    return this.value === other.value;
  }

  toString(): ItemStatusName {
    return this.value;
  }

  // BE_04 R5 — a transition returns a replacement; a value object is never mutated.
  // The table is the only authority on which moves are legal; the caller names the
  // refusal, so each illegal move reports its own condition (BE_04 R7).
  private transitionTo(next: ItemStatusName, refusal: () => DomainError): ItemStatus {
    if (!ItemStatus.TRANSITIONS[this.value].includes(next)) {
      throw refusal();
    }
    return new ItemStatus(next);
  }
}
