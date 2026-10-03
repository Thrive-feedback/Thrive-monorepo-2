import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { IdentityModule } from './modules/identity';
import { CodedErrorFilter } from './shared/presentation/coded-error.filter';
import { CorrelationIdMiddleware } from './shared/presentation/correlation-id.middleware';
import { HealthController } from './shared/presentation/health.controller';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [ConfigModule, SharedModule, DatabaseModule, IdentityModule],
  controllers: [HealthController],
  providers: [
    // Every value entering from outside is validated here, so a use case can assume its
    // input already matched a schema.
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Errors become responses in this one filter and nowhere else.
    { provide: APP_FILTER, useClass: CodedErrorFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // `{*splat}` rather than `*`: Express 5 resolves paths with path-to-regexp 8, which
    // rejects a bare wildcard.
    consumer.apply(CorrelationIdMiddleware).forRoutes('{*splat}');
  }
}
