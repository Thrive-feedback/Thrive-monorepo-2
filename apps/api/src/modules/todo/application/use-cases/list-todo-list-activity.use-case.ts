import { Injectable } from '@nestjs/common';
import { PaginationConfig } from '@app/config/configuration';
import { type ActivityPageView, ReadActivityPort } from '@app/modules/activity-log';

export interface ListTodoListActivityInput {
  readonly listId: string;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
}

export interface TodoListActivityPage extends ActivityPageView {
  readonly page: number;
  readonly pageSize: number;
}

/** BE_05 R3 — a query over another module's published port (BE_03 R6). */
@Injectable()
export class ListTodoListActivityUseCase {
  constructor(
    private readonly activity: ReadActivityPort,
    private readonly pagination: PaginationConfig,
  ) {}

  async execute(input: ListTodoListActivityInput): Promise<TodoListActivityPage> {
    const page = input.page ?? 1;
    const pageSize = Math.min(
      input.pageSize ?? this.pagination.defaultPageSize,
      this.pagination.maxPageSize,
    );
    const result = await this.activity.pageFor(input.listId, { page, pageSize });

    return { ...result, page, pageSize };
  }
}
