import {
  Inject,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import { AuthConfig } from '../../config/configuration';
import { DatabaseModule } from '../database/database.module';
import { PrismaService } from '../database/prisma.service';
import { AUTH, type Auth, createAuth } from './auth';

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
export class AuthModule implements NestModule {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  /**
   * Google sends the browser back here, through the web app's rewrite. The callback is the
   * only route Better Auth serves itself; signing in and out go through `/v1/sessions`. It
   * is a GET with no body, so the JSON parser Nest mounts first never touches it.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(toNodeHandler(this.auth)).forRoutes({
      path: 'api/auth/callback/*provider',
      method: RequestMethod.GET,
    });
  }
}
