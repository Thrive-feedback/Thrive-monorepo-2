import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import type { OneOnOneTemplate } from '../../domain/entity/one-on-one-template.entity';
import {
  type OneOnOneTemplateLayer,
  OneOnOneTemplateRepository,
} from '../../domain/repository/one-on-one-template-repository.port';
import {
  toOneOnOneTemplate,
  toOneOnOneTemplateRecord,
} from '../mapper/one-on-one-template.mapper';

/** Writes through `client`, so a save inside a unit of work joins its transaction. */
@Injectable()
export class PrismaOneOnOneTemplateRepository extends OneOnOneTemplateRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async findById(
    workspaceId: string,
    templateId: string,
  ): Promise<OneOnOneTemplate | null> {
    const record =
      await this.prismaTransactionContext.client.oneOnOneTemplate.findFirst({
        where: { id: templateId, workspaceId },
      });
    return record === null ? null : toOneOnOneTemplate(record);
  }

  async keptIn(
    workspaceId: string,
    layer: OneOnOneTemplateLayer,
  ): Promise<readonly OneOnOneTemplate[]> {
    // A layer keeps at most `MAX_TEMPLATES_PER_LAYER`, so this is a handful of rows.
    const records =
      await this.prismaTransactionContext.client.oneOnOneTemplate.findMany({
        where: {
          workspaceId,
          scope: layer.scope,
          ownerAccountId: layer.ownerAccountId,
          removedAt: null,
        },
      });
    return records.map(toOneOnOneTemplate);
  }

  async save(template: OneOnOneTemplate): Promise<void> {
    const { id, workspaceId, ...rest } = toOneOnOneTemplateRecord(template);
    await this.prismaTransactionContext.client.oneOnOneTemplate.upsert({
      where: { id },
      create: { id, workspaceId, ...rest },
      update: rest,
    });
  }
}
