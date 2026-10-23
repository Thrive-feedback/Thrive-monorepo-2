import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { harness } from '../support/harness';
import type { ApiResponse, ThriveWorld } from '../support/world';

/** Where a Workspace's Connections live, for the Workspace the person belongs to. */
function integrationsOf(world: ThriveWorld, name: string): string {
  return `/v1/workspaces/${world.workspaceOf(name)}/integrations`;
}

/** The `state` the API signed, read back out of the page it would have sent the Admin to. */
function stateIn(authorizeUrl: string): string {
  const state = new URL(authorizeUrl).searchParams.get('state');
  assert.ok(state, `No state was carried in ${authorizeUrl}`);
  return state;
}

/**
 * The whole round trip, as the web does it: ask where to send the Admin, come back with the
 * code the tool would have handed over, then choose a channel. The chat tool itself is a fake
 * (`BE_13` R9) — nothing in a scenario reaches Discord.
 */
async function connect(
  world: ThriveWorld,
  name: string,
  channelName: string,
): Promise<ApiResponse> {
  const path = integrationsOf(world, name);
  const begun = world.succeeded(
    await world.as(name, 'POST', `${path}/DISCORD/install`),
    `${name} beginning to connect Discord`,
  );
  const completed = world.succeeded(
    await world.as(name, 'POST', `${path}/DISCORD/complete`, {
      code: 'a-code-from-discord',
      state: stateIn(begun.body.authorizeUrl),
    }),
    `${name} coming back from Discord`,
  );
  const offered = completed.body.channels.find(
    (channel: { name: string }) => channel.name === channelName,
  );
  return world.as(name, 'PUT', `${path}/DISCORD/channel`, {
    installation: completed.body.installation,
    // A channel the tool never offered has no id here, so one is made up — which is exactly
    // what the refusal under test is about.
    channelId: offered?.id ?? 'channel-nobody-offered',
  });
}

Given('Discord will not let Thrive post', () => {
  harness().chatPoster.unreachableChannel();
});

Given('Discord will not let Thrive leave', () => {
  harness().chatInstaller.refusing('leave');
});

/** Disconnecting is one call, as the screen's button makes it. */
function disconnect(
  world: ThriveWorld,
  name: string,
  workspaceId: string,
): Promise<ApiResponse> {
  return world.as(
    name,
    'DELETE',
    `/v1/workspaces/${workspaceId}/integrations/DISCORD`,
  );
}

Given(
  '{person} has disconnected Discord',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await disconnect(this, name, this.workspaceOf(name)),
      `${name} disconnecting Discord`,
    );
  },
);

When(
  '{person} disconnects Discord',
  async function (this: ThriveWorld, name: string) {
    await disconnect(this, name, this.workspaceOf(name));
  },
);

When(
  "{person} disconnects Discord from {person}'s Workspace",
  async function (this: ThriveWorld, name: string, owner: string) {
    await disconnect(this, name, this.workspaceOf(owner));
  },
);

Then('Thrive has left the Discord server', () => {
  assert.ok(
    harness().chatInstaller.left.length > 0,
    'Thrive was never asked to leave the server.',
  );
});

Then(
  '{person} is told nothing is connected',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('CONNECTION_NOT_FOUND');
  },
);

Given(
  '{person} has connected Discord and chosen the {string} channel',
  async function (this: ThriveWorld, name: string, channelName: string) {
    this.succeeded(
      await connect(this, name, channelName),
      `${name} connecting Discord`,
    );
  },
);

When(
  '{person} connects Discord and chooses the {string} channel',
  async function (this: ThriveWorld, name: string, channelName: string) {
    await connect(this, name, channelName);
  },
);

When(
  "{person} begins connecting Discord to {person}'s Workspace",
  async function (this: ThriveWorld, name: string, owner: string) {
    await this.as(
      name,
      'POST',
      `/v1/workspaces/${this.workspaceOf(owner)}/integrations/DISCORD/install`,
    );
  },
);

When(
  '{person} comes back from Discord with a state nobody signed',
  async function (this: ThriveWorld, name: string) {
    await this.as(
      name,
      'POST',
      `${integrationsOf(this, name)}/DISCORD/complete`,
      { code: 'a-code-from-discord', state: 'not-a-token-thrive-signed' },
    );
  },
);

When(
  "{person} looks at what {person}'s Workspace has connected",
  async function (this: ThriveWorld, name: string, owner: string) {
    await this.as(
      name,
      'GET',
      `/v1/workspaces/${this.workspaceOf(owner)}/integrations`,
    );
  },
);

Then('a message arrives in the {string} channel', (channelName: string) => {
  const { chatInstaller, chatPoster } = harness();
  const channel = chatInstaller.channelsOffered.find(
    (offered) => offered.name === channelName,
  );
  assert.ok(channel, `No ${channelName} channel was ever offered.`);
  assert.ok(
    chatPoster.posts.some((post) => post.channelId === channel.id),
    `Nothing was posted in ${channelName}.`,
  );
});

Then(
  '{person} sees {string} and {string} connected by {person}',
  async function (
    this: ThriveWorld,
    name: string,
    spaceName: string,
    channelName: string,
    connectedBy: string,
  ) {
    const read =
      this.lastResponse?.body?.items ??
      this.succeeded(
        await this.as(name, 'GET', integrationsOf(this, name)),
        `${name} reading what is connected`,
      ).body.items;
    assert.deepEqual(
      read.map(
        (connection: {
          provider: string;
          externalWorkspaceName: string;
          externalChannelName: string;
          connectedByAccountId: string;
        }) => ({
          provider: connection.provider,
          space: connection.externalWorkspaceName,
          channel: connection.externalChannelName,
          connectedBy: connection.connectedByAccountId,
        }),
      ),
      [
        {
          provider: 'DISCORD',
          space: spaceName,
          channel: channelName,
          connectedBy: this.person(connectedBy).accountId,
        },
      ],
    );
  },
);

Then(
  "{person}'s Workspace has connected nothing",
  async function (this: ThriveWorld, name: string) {
    const read = this.succeeded(
      await this.as(name, 'GET', integrationsOf(this, name)),
      `${name} reading what is connected`,
    );
    assert.deepEqual(read.body.items, []);
  },
);

Then(
  '{person} is told they may not manage Integrations',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('NOT_ALLOWED_TO_MANAGE_INTEGRATIONS');
  },
);

Then(
  '{person} is told that Workspace does not exist',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('WORKSPACE_NOT_FOUND');
  },
);

Then(
  '{person} is told the install did not start here',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('INSTALL_STATE_INVALID');
  },
);

Then(
  '{person} is told that channel was not offered',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('CHANNEL_NOT_OFFERED');
  },
);

Then(
  '{person} is told Thrive could not post there',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('CHANNEL_UNREACHABLE');
  },
);
