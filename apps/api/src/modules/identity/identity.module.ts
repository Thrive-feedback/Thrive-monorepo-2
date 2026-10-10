import { AuthModule } from '@app/infrastructure/auth/auth.module';
import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { IdentityAdapter } from './application/adapter/identity.adapter';
import { IdentityPort } from './application/port/identity.port';
import { AccountQuery } from './application/query-port/account.query-port';
import { ProfileQuery } from './application/query-port/profile.query-port';
import { CreateProfileUseCase } from './application/use-cases/create-profile.use-case';
import { FindAccountSummariesUseCase } from './application/use-cases/find-account-summaries.use-case';
import { FindProfileOfAccountUseCase } from './application/use-cases/find-profile-of-account.use-case';
import { GetCurrentSessionUseCase } from './application/use-cases/get-current-session.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { SignOutUseCase } from './application/use-cases/sign-out.use-case';
import { StartGoogleSignInUseCase } from './application/use-cases/start-google-sign-in.use-case';
import { AccountSummaryPort } from './domain/port/account-summary.port';
import { HasProfilePort } from './domain/port/has-profile.port';
import { ProfileNamePort } from './domain/port/profile-name.port';
import { ProfileRepository } from './domain/repository/profile-repository.port';
import { BetterAuthIdentityAdapter } from './infrastructure/adapter/better-auth-identity.adapter';
import { PrismaAccountQuery } from './infrastructure/query/prisma-account.query';
import { PrismaProfileQuery } from './infrastructure/query/prisma-profile.query';
import { PrismaProfileRepository } from './infrastructure/repository/prisma-profile.repository';
import { ProfileController } from './presentation/profile.controller';
import { SessionController } from './presentation/session.controller';
import { SignedInGuard } from './presentation/signed-in.guard';

/**
 * Identity owns Account and Profile. It signs people in and out, keeps the Profile they
 * introduce themselves with, and guards every route of the app: only Identity can tell
 * who is calling. It publishes whether an Account has a Profile, the name on it and who
 * several Accounts are, and knows nothing of the modules that ask. The sign-in provider is bound to its port here and nowhere else.
 */
@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [SessionController, ProfileController],
  providers: [
    { provide: IdentityPort, useClass: BetterAuthIdentityAdapter },
    { provide: ProfileRepository, useClass: PrismaProfileRepository },
    { provide: ProfileQuery, useClass: PrismaProfileQuery },
    { provide: AccountQuery, useClass: PrismaAccountQuery },
    { provide: APP_GUARD, useClass: SignedInGuard },
    GetCurrentSessionUseCase,
    RefreshSessionUseCase,
    StartGoogleSignInUseCase,
    SignOutUseCase,
    CreateProfileUseCase,
    FindProfileOfAccountUseCase,
    FindAccountSummariesUseCase,
    IdentityAdapter,
    { provide: HasProfilePort, useExisting: IdentityAdapter },
    { provide: ProfileNamePort, useExisting: IdentityAdapter },
    { provide: AccountSummaryPort, useExisting: IdentityAdapter },
  ],
  exports: [HasProfilePort, ProfileNamePort, AccountSummaryPort],
})
export class IdentityModule {}
