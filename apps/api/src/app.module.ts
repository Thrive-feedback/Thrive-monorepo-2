import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { outboxModule } from './infrastructure/outbox/outbox.module';
import { FeedbackModule } from './modules/feedback';
import { IdentityModule } from './modules/identity';
import {
  ChannelAnnouncementOutboxHandler,
  FEEDBACK_PUBLISHED_TYPE,
  IntegrationsModule,
  KUDOS_GIVEN_TYPE,
} from './modules/integrations';
import { NotificationsModule } from './modules/notifications';
import { WorkspaceModule } from './modules/workspace';
import { WorkspaceGoalModule } from './modules/workspace-goal';
import { CodedErrorFilter } from './shared/presentation/coded-error.filter';
import { CorrelationIdMiddleware } from './shared/presentation/correlation-id.middleware';
import { HealthController } from './shared/presentation/health.controller';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule,
    SharedModule,
    DatabaseModule,
    // The composition root is where handlers are named, so the relay imports no module and no
    // module imports the relay (ADR 0076 D1).
    outboxModule({
      imports: [IntegrationsModule],
      handlers: {
        inject: [ChannelAnnouncementOutboxHandler],
        useFactory: (announcements: ChannelAnnouncementOutboxHandler) => [
          { type: FEEDBACK_PUBLISHED_TYPE, handler: announcements },
          { type: KUDOS_GIVEN_TYPE, handler: announcements },
        ],
      },
    }),
    IdentityModule,
    WorkspaceModule,
    FeedbackModule,
    WorkspaceGoalModule,
    IntegrationsModule,
    NotificationsModule,
  ],
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
