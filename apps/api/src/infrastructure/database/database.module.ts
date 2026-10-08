import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaTransactionContext } from './prisma-transaction.context';
import { PrismaUnitOfWork } from './prisma-unit-of-work.adapter';

@Module({
  providers: [
    PrismaService,
    PrismaTransactionContext,
    { provide: UnitOfWork, useClass: PrismaUnitOfWork },
  ],
  exports: [PrismaService, PrismaTransactionContext, UnitOfWork],
})
export class DatabaseModule {}
