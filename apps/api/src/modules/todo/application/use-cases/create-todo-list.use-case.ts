import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { RecordActivityPort } from '@app/modules/activity-log';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { TodoListRepository } from '../../domain/repository/todo-list.repository.port';
import { TodoList } from '../../domain/entity/todo-list.entity';
import { TodoListId } from '../../domain/value-object/todo-list-id.vo';
import { TodoTitle } from '../../domain/value-object/todo-title.vo';
import { IdempotencyStore } from '../port/idempotency-store.port';
import { DuplicateTodoListTitleError, IdempotencyKeyConflictError } from '../todo.errors';

/** BE_05 R7 — a plain input object. No transport type enters the application layer. */
export interface CreateTodoListInput {
  readonly title: string;
  /** BE_07 R8 — optional client-supplied key making a retried create safe. */
  readonly idempotencyKey?: string | undefined;
}

export interface CreateTodoListResult {
  readonly id: string;
}

/**
 * BE_05 R1 — one use case per file, one public method.
 * BE_05 R3 — this changes state; it answers no question beyond the id it created.
 */
@Injectable()
export class CreateTodoListUseCase {
  constructor(
    // BE_05 R5 — the narrowest contracts that cover the need, not a grab-bag service.
    private readonly repository: TodoListRepository,
    private readonly idGenerator: IdGenerator,
    private readonly idempotency: IdempotencyStore,
    private readonly activity: RecordActivityPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: CreateTodoListInput): Promise<CreateTodoListResult> {
    // BE_05 R2 — the title's own rules belong to the value object, not to this method.
    const title = TodoTitle.of(input.title);
    const fingerprint = fingerprintOf(title);

    // BE_05 R8 — the replay check, the uniqueness check and both writes are one unit,
    // so two concurrent creates cannot both pass the checks.
    const created = await this.unitOfWork.run(async () => {
      const replayed = await this.replayOf(input.idempotencyKey, fingerprint);
      if (replayed !== null) {
        return { ...replayed, replayed: true };
      }

      // BE_05 R6 — uniqueness across aggregates is a workflow decision, so it is an
      // application error. A single list cannot see its siblings to decide this itself.
      if ((await this.repository.findByTitle(title)) !== null) {
        throw new DuplicateTodoListTitleError();
      }

      const list = TodoList.create(TodoListId.of(this.idGenerator.next()), title);
      await this.repository.save(list);

      const listId = list.identity().toString();
      if (input.idempotencyKey !== undefined) {
        await this.idempotency.remember(input.idempotencyKey, { resourceId: listId, fingerprint });
      }
      return { id: listId, replayed: false };
    });

    if (created.replayed) {
      return { id: created.id };
    }
    const id = created.id;

    // BE_05 R9 — an effect that may safely be retried goes *after* the write. Losing
    // an activity line must never cost the list that was created.
    await this.activity.record({ subjectId: id, action: 'todo-list.created', detail: title.toString() });

    return { id };
  }

  private async replayOf(
    key: string | undefined,
    fingerprint: string,
  ): Promise<CreateTodoListResult | null> {
    if (key === undefined) {
      return null;
    }

    const remembered = await this.idempotency.find(key);
    if (remembered === null) {
      return null;
    }
    if (remembered.fingerprint !== fingerprint) {
      throw new IdempotencyKeyConflictError();
    }
    return { id: remembered.resourceId };
  }
}

function fingerprintOf(title: TodoTitle): string {
  return createHash('sha256').update(title.toString()).digest('hex');
}
