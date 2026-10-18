import type { Configuration } from '@app/config/configuration';
import type { Auth } from '@app/infrastructure/auth/auth';
import type { PrismaService } from '@app/infrastructure/database/prisma.service';
import type { INestApplication } from '@nestjs/common';
import type { FakeEmailSender } from './email-sender.fake';
import type { FakeChatInstaller, FakeChatPoster } from './integrations.fakes';

/**
 * The application the scenarios run against: booted once per run, wired as it ships, with
 * only the providers that reach outside replaced — the email transport and the chat tool
 * (`BE_13` R9). Scenario state never lives here — that is the World's (`BE_13` R5).
 */
export interface Harness {
  readonly app: INestApplication;
  readonly baseUrl: string;
  readonly emailSender: FakeEmailSender;
  /** The chat tool a scenario connects to; nothing reaches Discord. */
  readonly chatInstaller: FakeChatInstaller;
  readonly chatPoster: FakeChatPoster;
  readonly prismaService: PrismaService;
  readonly auth: Auth;
  readonly configuration: Configuration;
}

let current: Harness | undefined;

export function setHarness(harness: Harness | undefined): void {
  current = harness;
}

export function harness(): Harness {
  if (!current) {
    throw new Error(
      'The application has not been started; the BeforeAll hook did not run.',
    );
  }
  return current;
}
