import { Module } from '@nestjs/common';
import { AuthConfig } from '../../config/configuration';
import { DatabaseModule } from '../database/database.module';
import { PrismaService } from '../database/prisma.service';
import { AUTH, createAuth } from './auth';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: AUTH,
      useFactory: (prisma: PrismaService, config: AuthConfig) =>
        createAuth(prisma, config),
      inject: [PrismaService, AuthConfig],
    },
  ],
  exports: [AUTH],
})
export class AuthModule {}
