import { AuthModule } from '@app/infrastructure/auth/auth.module';
import { Module } from '@nestjs/common';
import { IdentityPort } from './application/port/identity.port';
import { GetCurrentSessionUseCase } from './application/use-cases/get-current-session.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { SignOutUseCase } from './application/use-cases/sign-out.use-case';
import { StartGoogleSignInUseCase } from './application/use-cases/start-google-sign-in.use-case';
import { BetterAuthIdentityAdapter } from './infrastructure/adapter/better-auth-identity.adapter';
import { SessionController } from './presentation/session.controller';

/**
 * Identity owns Account and Profile. Today it signs people in and out; the sign-in
 * provider is bound to its port here and nowhere else.
 */
@Module({
  imports: [AuthModule],
  controllers: [SessionController],
  providers: [
    { provide: IdentityPort, useClass: BetterAuthIdentityAdapter },
    GetCurrentSessionUseCase,
    RefreshSessionUseCase,
    StartGoogleSignInUseCase,
    SignOutUseCase,
  ],
})
export class IdentityModule {}
