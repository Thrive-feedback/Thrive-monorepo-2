import type { OneOnOneTemplate as OneOnOneTemplateRecord } from '@app/infrastructure/database/generated/client';
import type { OneOnOneTemplateRow } from '../../application/types/one-on-one-template.types';
import { OneOnOneTemplate } from '../../domain/entity/one-on-one-template.entity';

/** The only place that knows both the stored row and the template entity. */

/** The audit timestamps are the database's to set. */
export function toOneOnOneTemplateRecord(
  template: OneOnOneTemplate,
): Omit<OneOnOneTemplateRecord, 'createdAt' | 'updatedAt'> {
  const snapshot = template.snapshot();
  return {
    id: snapshot.id,
    workspaceId: snapshot.workspaceId,
    scope: snapshot.scope,
    ownerAccountId: snapshot.ownerAccountId,
    name: snapshot.name,
    suggestedWhen: snapshot.suggestedWhen,
    questions: [...snapshot.questions],
    removedAt: snapshot.removedAt,
  };
}

export function toOneOnOneTemplate(
  record: OneOnOneTemplateRecord,
): OneOnOneTemplate {
  return OneOnOneTemplate.restore({
    id: record.id,
    workspaceId: record.workspaceId,
    scope: record.scope,
    ownerAccountId: record.ownerAccountId,
    name: record.name,
    suggestedWhen: record.suggestedWhen,
    questions: record.questions,
    removedAt: record.removedAt,
  });
}

export function toOneOnOneTemplateRow(
  record: Pick<
    OneOnOneTemplateRecord,
    'id' | 'scope' | 'ownerAccountId' | 'name' | 'suggestedWhen' | 'questions'
  >,
): OneOnOneTemplateRow {
  return {
    id: record.id,
    scope: record.scope,
    ownerAccountId: record.ownerAccountId,
    name: record.name,
    suggestedWhen: record.suggestedWhen,
    questions: record.questions,
  };
}
