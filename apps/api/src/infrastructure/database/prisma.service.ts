import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { DatabaseConfig } from '../../config/configuration';
import { PrismaClient } from './generated/client';

const DATABASE_CONNECTION_TIMEOUT_MS = 5_000;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(databaseConfig: DatabaseConfig) {
    super({
      adapter: new PrismaPg({
        connectionString: databaseConfig.url,
        connectionTimeoutMillis: DATABASE_CONNECTION_TIMEOUT_MS,
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
