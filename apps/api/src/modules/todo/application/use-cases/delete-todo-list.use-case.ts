import { Injectable } from '@nestjs/common';
import { RecordActivityPort } from '@app/modules/activity-log';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { TodoListRepository } from '../../domain/repository/todo-list.repository.port';
import { TodoListMutationService } from '../service/todo-list-mutation.service';

export interface DeleteTodoListInput {
  readonly listId: string;
}

@Injectable()
export class DeleteTodoListUseCase {
  constructor(
    private readonly lists: TodoListMutationService,
    private readonly repository: TodoListRepository,
    private readonly activity: RecordActivityPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: DeleteTodoListInput): Promise<void> {
    // BE_05 R6 — deleting something absent is a workflow failure, decided here, so a
    // caller gets 404 rather than a silent success.
    // BE_05 R8 — one unit, so a concurrent change cannot save the list back after it is gone.
    await this.unitOfWork.run(async () => {
      const list = await this.lists.loadOrThrow(input.listId);
      await this.repository.delete(list.identity());
    });

    await this.activity.record({ subjectId: input.listId, action: 'todo-list.deleted' });
  }
}
