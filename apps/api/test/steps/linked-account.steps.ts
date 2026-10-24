import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { harness } from '../support/harness';
import type { ApiResponse, ThriveWorld } from '../support/world';

/** A Linked Account belongs to an Account, so there is no Workspace anywhere in this path. */
const LINKS = '/v1/linked-accounts/mine';

/** The `state` the API signed, read back out of the page it would have sent the Member to. */
function stateIn(authorizeUrl: string): string {
  const state = new URL(authorizeUrl).searchParams.get('state');
  assert.ok(state, `No state was carried in ${authorizeUrl}`);
  return state;
}

async function beginLink(world: ThriveWorld, name: string): Promise<string> {
  const begun = world.succeeded(
    await world.as(name, 'POST', `${LINKS}/DISCORD/link`),
    `${name} beginning to link Discord`,
  );
  return stateIn(begun.body.authorizeUrl);
}

/**
 * The whole round trip, as the web does it: ask where to send the Member, then come back with
 * the code the tool would have handed over. The chat tool itself is a fake (`BE_13` R9) —
 * nothing in a scenario reaches Discord.
 */
async function link(
  world: ThriveWorld,
  name: string,
  username: string,
): Promise<ApiResponse> {
  const state = await beginLink(world, name);
  // Who the tool says authorised. The username doubles as the id, so two people claiming the
  // same name in a scenario are claiming the same Discord account — which is the point of one
  // of these scenarios.
  harness().accountLinker.withIdentity({
    externalUserId: `discord-${username}`,
    externalUsername: username,
  });
  return world.as(name, 'POST', `${LINKS}/DISCORD/complete`, {
    code: 'a-code-from-discord',
    state,
  });
}

Given(
  '{person} has linked her/his/their Discord account as {string}',
  async function (this: ThriveWorld, name: string, username: string) {
    this.succeeded(await link(this, name, username), `${name} linking Discord`);
  },
);

When(
  '{person} links her/his/their Discord account as {string}',
  async function (this: ThriveWorld, name: string, username: string) {
    await link(this, name, username);
  },
);

When(
  '{person} looks at her/his/their linked accounts',
  async function (this: ThriveWorld, name: string) {
    await this.as(name, 'GET', LINKS);
  },
);

When(
  '{person} unlinks Discord',
  async function (this: ThriveWorld, name: string) {
    await this.as(name, 'DELETE', `${LINKS}/DISCORD`);
  },
);

When(
  '{person} begins linking an account in {string}',
  async function (this: ThriveWorld, name: string, provider: string) {
    await this.as(name, 'POST', `${LINKS}/${provider}/link`);
  },
);

When(
  '{person} comes back from Discord with a state Thrive never signed',
  async function (this: ThriveWorld, name: string) {
    await this.as(name, 'POST', `${LINKS}/DISCORD/complete`, {
      code: 'a-code-from-discord',
      state: 'not-a-state-thrive-signed',
    });
  },
);

When(
  '{person} comes back from Discord with the state {person} started',
  async function (this: ThriveWorld, name: string, other: string) {
    // The sharpest refusal in this card: without it, a crafted link attaches the attacker's
    // Discord account to somebody else's Thrive Account, and every direct message meant for
    // them arrives somewhere else from then on.
    const theirs = await beginLink(this, other);
    await this.as(name, 'POST', `${LINKS}/DISCORD/complete`, {
      code: 'a-code-from-discord',
      state: theirs,
    });
  },
);

Then(
  '{person} sees {string} linked for Discord',
  async function (this: ThriveWorld, name: string, username: string) {
    const read = this.succeeded(
      await this.as(name, 'GET', LINKS),
      `${name} reading their linked accounts`,
    );
    assert.deepEqual(
      read.body.items.map(
        (item: { provider: string; externalUsername: string }) => [
          item.provider,
          item.externalUsername,
        ],
      ),
      [['DISCORD', username]],
    );
  },
);

Then(
  '{person} has no linked accounts',
  async function (this: ThriveWorld, name: string) {
    const read = this.succeeded(
      await this.as(name, 'GET', LINKS),
      `${name} reading their linked accounts`,
    );
    assert.deepEqual(read.body.items, []);
  },
);

Then(
  '{person} is told she/he/they has/have not linked that chat tool',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('NOT_LINKED');
  },
);

Then(
  '{person} is told that chat account is already linked',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('ACCOUNT_ALREADY_LINKED');
  },
);

Then(
  '{person} is told the link did not start here',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('LINK_STATE_INVALID');
  },
);

Then(
  '{person} is told Thrive does not use that chat tool',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('PROVIDER_NOT_SUPPORTED');
  },
);
