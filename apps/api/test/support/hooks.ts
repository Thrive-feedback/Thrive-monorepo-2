import { CONFIGURATION } from '@app/config/configuration';
import { AUTH } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { OutboxRelay } from '@app/infrastructure/outbox/outbox-relay.service';
import { ChatInstaller } from '@app/modules/integrations/application/port/chat-installer.port';
import { AccountLinker } from '@app/modules/notifications/application/port/account-linker.port';
import { DirectMessenger } from '@app/modules/notifications/application/port/direct-messenger.port';
import { AiCompleter } from '@app/shared/application/ai-completer.port';
import { ChatPoster } from '@app/shared/application/chat-poster.port';
import { EmailSender } from '@app/shared/application/email-sender.port';
import { After, AfterAll, Before, BeforeAll } from '@cucumber/cucumber';
import { Test } from '@nestjs/testing';
import { FakeAiCompleter } from './ai.fake';
import { FakeEmailSender } from './email-sender.fake';
import { harness, setHarness } from './harness';
import { FakeChatInstaller, FakeChatPoster } from './integrations.fakes';
import { FakeAccountLinker, FakeDirectMessenger } from './notifications.fakes';
import { WorkspaceFixtures } from './workspace.integration-fixtures';
import type { ThriveWorld } from './world';

// Booting the API takes a couple of seconds; Cucumber's default hook timeout is five.
const BOOT_TIMEOUT_MS = 30_000;

BeforeAll({ timeout: BOOT_TIMEOUT_MS }, async () => {
  // The configuration requires the email provider's credentials at boot (ADR 0038), but
  // nothing here sends email: the provider is replaced below. Placeholders let the suite run
  // without the real secret, and never replace one that is set.
  process.env.RESEND_API_KEY ??= 'not-used-by-the-scenarios';
  process.env.RESEND_FROM_ADDRESS ??= 'scenarios@thrive.test';
  // Likewise the chat tool's credentials: the installer and the bot client are replaced below,
  // so nothing here reaches Discord.
  process.env.DISCORD_CLIENT_ID ??= 'not-used-by-the-scenarios';
  process.env.DISCORD_CLIENT_SECRET ??= 'not-used-by-the-scenarios';
  process.env.DISCORD_BOT_TOKEN ??= 'not-used-by-the-scenarios';
  // And the model provider's, which the configuration also requires at boot (ADR 0077). The
  // completer is replaced below, so no scenario depends on what a model would have answered.
  process.env.AI_PROVIDER_ENDPOINT ??= 'https://ai.thrive.test/v1';
  process.env.AI_PROVIDER_API_KEY ??= 'not-used-by-the-scenarios';
  process.env.AI_PROVIDER_MODEL ??= 'not-used-by-the-scenarios';
  process.env.AI_PROVIDER_LABEL ??= 'SCENARIOS';

  const emailSender = new FakeEmailSender();
  const chatInstaller = new FakeChatInstaller().withChannels(
    { id: 'channel-general', name: 'general' },
    { id: 'channel-standups', name: 'standups' },
  );
  const chatPoster = new FakeChatPoster();
  const accountLinker = new FakeAccountLinker();
  const directMessenger = new FakeDirectMessenger();
  const aiCompleter = new FakeAiCompleter();
  // Imported only now, so the placeholders above are in place before the configuration loads.
  const { AppModule } = await import('@app/app.module');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EmailSender)
    .useValue(emailSender)
    .overrideProvider(ChatInstaller)
    .useValue(chatInstaller)
    .overrideProvider(ChatPoster)
    .useValue(chatPoster)
    .overrideProvider(AccountLinker)
    .useValue(accountLinker)
    .overrideProvider(DirectMessenger)
    .useValue(directMessenger)
    .overrideProvider(AiCompleter)
    .useValue(aiCompleter)
    .compile();
  const app = moduleRef.createNestApplication();
  // Port 0: the system picks a free one, so a running dev server is never in the way.
  await app.listen(0);
  // The outbox drains by hand in these scenarios: a poller ticking behind them would race
  // whatever each one asserts (ADR 0076 D13).
  app.get(OutboxRelay).stopPolling();
  setHarness({
    app,
    baseUrl: (await app.getUrl()).replace('[::1]', 'localhost'),
    emailSender,
    chatInstaller,
    chatPoster,
    accountLinker,
    directMessenger,
    aiCompleter,
    prismaService: app.get(PrismaService),
    auth: app.get(AUTH),
    configuration: app.get(CONFIGURATION),
  });
});

Before(function (this: ThriveWorld) {
  const {
    prismaService,
    auth,
    configuration,
    chatInstaller,
    chatPoster,
    accountLinker,
    directMessenger,
    aiCompleter,
  } = harness();
  // The application boots once for the whole run, so the fakes it holds are returned to how
  // they started rather than carrying one scenario's setup into the next.
  chatInstaller.reset();
  chatPoster.reset();
  accountLinker.reset();
  directMessenger.reset();
  aiCompleter.reset();
  this.fixtures = new WorkspaceFixtures(prismaService, auth, configuration);
});

After(async function (this: ThriveWorld) {
  await this.fixtures.removeAll();
  // The outbox belongs to no Workspace, so the fixtures cannot take its rows with them. Left
  // behind they would be claimed by the next scenario's drain, which is both a leak between
  // scenarios and — at a batch of twenty — enough to push a scenario's own message out of reach.
  await harness().prismaService.outboxMessage.deleteMany({});
});

AfterAll(async () => {
  await harness().app.close();
  setHarness(undefined);
});
