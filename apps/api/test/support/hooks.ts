import { CONFIGURATION } from '@app/config/configuration';
import { AUTH } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { EmailSender } from '@app/shared/application/email-sender.port';
import { After, AfterAll, Before, BeforeAll } from '@cucumber/cucumber';
import { Test } from '@nestjs/testing';
import { FakeEmailSender } from './email-sender.fake';
import { harness, setHarness } from './harness';
import { WorkspaceFixtures } from './workspace.integration-fixtures';
import type { ThriveWorld } from './world';

// Booting the API takes a couple of seconds; Cucumber's default hook timeout is five.
const BOOT_TIMEOUT_MS = 30_000;

BeforeAll({ timeout: BOOT_TIMEOUT_MS }, async () => {
  // The configuration requires Gmail credentials at boot (ADR 0036), but nothing here sends
  // email: the provider is replaced below. Placeholders let the suite run without the real
  // secret, and never replace one that is set.
  process.env.GMAIL_SMTP_USER ??= 'scenarios@thrive.test';
  process.env.GMAIL_SMTP_APP_PASSWORD ??= 'not-used-by-the-scenarios';

  const emailSender = new FakeEmailSender();
  // Imported only now, so the placeholders above are in place before the configuration loads.
  const { AppModule } = await import('@app/app.module');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EmailSender)
    .useValue(emailSender)
    .compile();
  const app = moduleRef.createNestApplication();
  // Port 0: the system picks a free one, so a running dev server is never in the way.
  await app.listen(0);
  setHarness({
    app,
    baseUrl: (await app.getUrl()).replace('[::1]', 'localhost'),
    emailSender,
    prismaService: app.get(PrismaService),
    auth: app.get(AUTH),
    configuration: app.get(CONFIGURATION),
  });
});

Before(function (this: ThriveWorld) {
  const { prismaService, auth, configuration } = harness();
  this.fixtures = new WorkspaceFixtures(prismaService, auth, configuration);
});

After(async function (this: ThriveWorld) {
  await this.fixtures.removeAll();
});

AfterAll(async () => {
  await harness().app.close();
  setHarness(undefined);
});
