-- Better Auth's tables take the glossary's names (ADR 0027): `user` becomes `account`, a
-- Thrive Account, and `account` becomes `sign_in_method`, one sign-in method linked to it.
-- `session` and `verification` keep their names. The Prisma models keep Better Auth's names
-- (`User`, `Account`) and point at these tables through `@@map`.
--
-- Existing rows: renamed in place, none are copied or lost. Written by hand, because
-- Prisma's diff for a changed `@@map` drops the table and creates a new one. `account` is
-- renamed first so that its name is free for `user`. Foreign keys follow the tables;
-- `session_userId_fkey` keeps its name.
--
-- Rollback:
--   ALTER INDEX "account_email_key" RENAME TO "user_email_key";
--   ALTER TABLE "account" RENAME CONSTRAINT "account_pkey" TO "user_pkey";
--   ALTER TABLE "account" RENAME TO "user";
--   ALTER INDEX "sign_in_method_userId_idx" RENAME TO "account_userId_idx";
--   ALTER TABLE "sign_in_method" RENAME CONSTRAINT "sign_in_method_userId_fkey" TO "account_userId_fkey";
--   ALTER TABLE "sign_in_method" RENAME CONSTRAINT "sign_in_method_pkey" TO "account_pkey";
--   ALTER TABLE "sign_in_method" RENAME TO "account";
--
-- Data classes, under the new table names. Written here because `auth:generate` rewrites
-- schema.prisma.
--   sensitive (never logged, never cached):
--     sign_in_method."accessToken", sign_in_method."refreshToken" encrypted at rest by
--       Better Auth (`encryptOAuthTokens`);
--     sign_in_method."idToken" never stored: a hook clears it, because nothing reads it
--       after sign-in and Better Auth would not encrypt it;
--     session."token", verification."value" (the sign-in state and PKCE verifier) are
--       not encrypted, because Better Auth finds rows by them; both are random, short-lived
--       and deleted when they end;
--     sign_in_method."password" unused: sign-in is Google only.
--   personal (never logged; deleted with the Account):
--     account."email", account."name", account."image", session."ipAddress",
--     session."userAgent", sign_in_method."accountId" (Google's id for the person).
--   internal: every "id", "userId", "providerId", "scope", "emailVerified",
--     "identifier", and every timestamp.

-- RenameTable
ALTER TABLE "account" RENAME TO "sign_in_method";
ALTER TABLE "sign_in_method" RENAME CONSTRAINT "account_pkey" TO "sign_in_method_pkey";
ALTER TABLE "sign_in_method" RENAME CONSTRAINT "account_userId_fkey" TO "sign_in_method_userId_fkey";
ALTER INDEX "account_userId_idx" RENAME TO "sign_in_method_userId_idx";

-- RenameTable
ALTER TABLE "user" RENAME TO "account";
ALTER TABLE "account" RENAME CONSTRAINT "user_pkey" TO "account_pkey";
ALTER INDEX "user_email_key" RENAME TO "account_email_key";
