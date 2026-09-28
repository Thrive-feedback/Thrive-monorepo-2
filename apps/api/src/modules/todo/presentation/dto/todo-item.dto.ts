import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  pageSchemaOf,
  paginationQueryShape,
  sortDirectionSchema,
  titleSchema,
  uuidSchema,
} from './shared.schema';
import { todoItemViewSchema } from './todo-list.dto';

/* ── path parameters ───────────────────────────────────────────────────────── */
export class TodoItemParamsDto extends createZodDto(
  z.object({ listId: uuidSchema, itemId: uuidSchema }),
) {}

/* ── add ───────────────────────────────────────────────────────────────────── */
export const addTodoItemRequestSchema = z.object({
  title: titleSchema,
  // GEN_11 — an instant on the wire is ISO-8601 UTC. The timezone a person sees is
  // applied by the client, never stored.
  dueDate: z.iso.datetime().optional(),
});
export class AddTodoItemRequestDto extends createZodDto(addTodoItemRequestSchema) {}

export const addTodoItemResponseSchema = z.object({ id: uuidSchema });
export class AddTodoItemResponseDto extends createZodDto(addTodoItemResponseSchema) {}

/* ── rename ────────────────────────────────────────────────────────────────── */
export const renameTodoItemRequestSchema = z.object({ title: titleSchema });
export class RenameTodoItemRequestDto extends createZodDto(renameTodoItemRequestSchema) {}

/* ── read a page ───────────────────────────────────────────────────────────── */
export const listTodoItemsQuerySchema = z.object({
  ...paginationQueryShape,
  status: z.enum(['open', 'completed']).optional(),
  sort: z.enum(['createdAt', 'dueDate', 'title']).default('createdAt'),
  direction: sortDirectionSchema.default('asc'),
});
export class ListTodoItemsQueryDto extends createZodDto(listTodoItemsQuerySchema) {}

export const listTodoItemsResponseSchema = pageSchemaOf(todoItemViewSchema);
export class ListTodoItemsResponseDto extends createZodDto(listTodoItemsResponseSchema) {}

/* ── bulk complete ─────────────────────────────────────────────────────────── */
export const bulkCompleteItemsRequestSchema = z.object({
  itemIds: z.array(uuidSchema).min(1).max(200),
});
export class BulkCompleteItemsRequestDto extends createZodDto(bulkCompleteItemsRequestSchema) {}

export const bulkCompleteItemsResponseSchema = z.object({
  completedIds: z.array(uuidSchema),
});
export class BulkCompleteItemsResponseDto extends createZodDto(bulkCompleteItemsResponseSchema) {}

/* ── activity ──────────────────────────────────────────────────────────────── */
export const listActivityQuerySchema = z.object(paginationQueryShape);
export class ListActivityQueryDto extends createZodDto(listActivityQuerySchema) {}

export const listActivityResponseSchema = pageSchemaOf(
  z.object({
    id: uuidSchema,
    subjectId: uuidSchema,
    action: z.string(),
    detail: z.string().nullable(),
    occurredAt: z.iso.datetime(),
  }),
);
export class ListActivityResponseDto extends createZodDto(listActivityResponseSchema) {}
