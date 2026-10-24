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

Given(
  '{person} has unlinked Discord',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(name, 'DELETE', `${LINKS}/DISCORD`),
      `${name} unlinking Discord`,
    );
  },
);

Given('Discord will not let Thrive message anybody', () => {
  // The refusal lands on the message rather than on opening the conversation, which is where
  // Discord most often puts it: the bot may open a conversation and still be refused the post.
  harness().directMessenger.refusingTo('post');
});

/**
 * Every direct message Thrive sent in this scenario. The chat tool is a fake (`BE_13` R9) —
 * nothing here reaches Discord.
 */
function messagesSent() {
  return harness().directMessenger.posted;
}

/**
 * A message is sent **after** the request it is about has committed, and is never awaited, so
 * that asking for Feedback is not held up by a chat tool (design 0021 D5). The API has therefore
 * already answered by the time a step runs, and the message may not have left yet.
 *
 * So these steps wait for it rather than pretending it is synchronous — which is also the
 * honest description of the behaviour: it arrives shortly afterwards, not atomically.
 */
async function eventually(
  isReady: () => boolean,
  what: string,
  timeoutMs = 2000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!isReady()) {
    if (Date.now() > deadline) {
      assert.fail(`Timed out after ${timeoutMs}ms waiting for ${what}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

/**
 * For the scenarios that assert **nothing** was sent: there is no event to wait for, so this
 * gives anything in flight a moment to arrive and then checks it did not. Without it the
 * assertion could pass simply by running first.
 */
async function settled(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 150));
}

Then(
  '{person} is messaged in Discord about {string}',
  async function (this: ThriveWorld, _name: string, about: string) {
    await eventually(
      () => messagesSent().length > 0,
      'a direct message to arrive',
    );
    const sent = messagesSent();
    assert.equal(sent.length, 1, `Expected one message, got ${sent.length}.`);
    assert.ok(
      sent[0]?.text.includes(about),
      `The message did not mention "${about}": ${sent[0]?.text}`,
    );
  },
);

Then('the message names {string}', function (this: ThriveWorld, name: string) {
  // One Account can be a Member of several Workspaces and they all reach the same conversation,
  // so a message that did not name its Workspace would be ambiguous (brain `ADR-0034`).
  assert.ok(
    messagesSent()[0]?.text.includes(name),
    `The message did not name "${name}": ${messagesSent()[0]?.text}`,
  );
});

Then('the message links to the Ask', function (this: ThriveWorld) {
  assert.match(messagesSent()[0]?.text ?? '', /\/home\?tab=waiting&ask=/);
});

Then('nobody is messaged in Discord', async function (this: ThriveWorld) {
  await settled();
  assert.deepEqual(messagesSent(), []);
});
