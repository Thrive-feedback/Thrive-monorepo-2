import assert from 'node:assert/strict';
import { defineParameterType, Given, Then, When } from '@cucumber/cucumber';
import type { ThriveWorld } from '../support/world';
import { readToTheEnd } from './feed-items.steps';

interface ReceivedItem {
  readonly message: string;
  readonly tags: {
    readonly mentions: readonly {
      readonly slug: string;
      readonly displayName: string;
    }[];
  };
}

function receivedItems(world: ThriveWorld): ReceivedItem[] {
  const items: ReceivedItem[] | undefined = world.lastResponse?.body?.items;
  assert.ok(items, 'Nothing was read from Received.');
  return items;
}

/**
 * The words as a reader sees them. The feature names people; what was sent, and is read back,
 * carries their slugs.
 */
export function messagesRead(world: ThriveWorld): string[] {
  return receivedItems(world).map(({ message, tags }) =>
    tags.mentions.reduce(
      (read, { slug, displayName }) =>
        read.replace(`@${slug}`, `@${displayName}`),
      message,
    ),
  );
}

/** Which kind Received is narrowed to, in the feature's words, as the route names it. */
const RECEIVED_KINDS: Readonly<Record<string, string>> = {
  'their requests': 'REQUESTS',
  'Feedback given unasked': 'OFFERED',
  Kudos: 'KUDOS',
};

defineParameterType({
  name: 'receivedKind',
  regexp: /their requests|Feedback given unasked|Kudos/,
  transformer: (kind: string) => RECEIVED_KINDS[kind],
});

/** Where a read of Received two at a time got to, for the step that reads on from there. */
const readSoFar = new WeakMap<
  ThriveWorld,
  { readonly messages: string[]; readonly cursor: string | null }
>();

function looksAtReceived(world: ThriveWorld, name: string, query: string) {
  return world.as(
    name,
    'GET',
    `/v1/workspaces/${world.workspaceOf(name)}/received-items${query}`,
  );
}

When(
  '{person} looks at what they have received',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await looksAtReceived(this, name, ''),
      `${name} reading Received`,
    );
  },
);

When(
  '{person} looks at what they have received, showing {receivedKind}',
  async function (this: ThriveWorld, name: string, show: string) {
    this.succeeded(
      await looksAtReceived(this, name, `?show=${show}`),
      `${name} reading Received, showing ${show}`,
    );
  },
);

When(
  '{person} looks at what they have received, showing something it does not have',
  async function (this: ThriveWorld, name: string) {
    await looksAtReceived(this, name, '?show=EVERYONE');
  },
);

Then('Received refuses the choice', function (this: ThriveWorld) {
  this.refusedWith('REQUEST_INVALID');
});

When(
  "{person} signs in and looks at what was received in {person}'s Workspace",
  async function (this: ThriveWorld, outsider: string, member: string) {
    if (!this.isSignedIn(outsider)) {
      await this.signIn(outsider);
    }
    await this.as(
      outsider,
      'GET',
      `/v1/workspaces/${this.workspaceOf(member)}/received-items`,
    );
  },
);

/** One page of two, after `cursor` or from the top, added to what was read; the next cursor. */
async function readTwoMore(
  world: ThriveWorld,
  name: string,
  messages: string[],
  cursor: string | null,
): Promise<string | null> {
  const query = cursor === null ? '' : `&cursor=${cursor}`;
  const page = world.succeeded(
    await looksAtReceived(world, name, `?limit=2${query}`),
    `${name} reading a page of Received`,
  );
  messages.push(...messagesRead(world));
  return page.body.nextCursor;
}

When(
  '{person} reads Received two at a time to the end',
  async function (this: ThriveWorld, name: string) {
    const messages: string[] = [];
    let cursor = await readTwoMore(this, name, messages, null);
    while (cursor !== null) {
      cursor = await readTwoMore(this, name, messages, cursor);
    }
    readToTheEnd.set(this, messages);
  },
);

Given(
  '{person} has read the first two of Received',
  async function (this: ThriveWorld, name: string) {
    const messages: string[] = [];
    const cursor = await readTwoMore(this, name, messages, null);
    readSoFar.set(this, { messages, cursor });
  },
);

When(
  '{person} reads the rest of Received two at a time',
  async function (this: ThriveWorld, name: string) {
    const soFar = readSoFar.get(this);
    assert.ok(soFar, `${name} has not started reading Received.`);
    const messages = [...soFar.messages];
    let { cursor } = soFar;
    while (cursor !== null) {
      cursor = await readTwoMore(this, name, messages, cursor);
    }
    readToTheEnd.set(this, messages);
  },
);

Then(
  "{person}'s Received reads {string}",
  function (this: ThriveWorld, _name: string, message: string) {
    assert.deepEqual(messagesRead(this), [message]);
  },
);

Then(
  "{person}'s Received reads {string} then {string}",
  function (this: ThriveWorld, _name: string, first: string, second: string) {
    assert.deepEqual(messagesRead(this), [first, second]);
  },
);

Then(
  "{person}'s Received reads {string} then {string} then {string}",
  function (
    this: ThriveWorld,
    _name: string,
    first: string,
    second: string,
    third: string,
  ) {
    assert.deepEqual(messagesRead(this), [first, second, third]);
  },
);

Then(
  "{person}'s Received is empty",
  function (this: ThriveWorld, _name: string) {
    assert.deepEqual(receivedItems(this), []);
    assert.equal(this.lastResponse?.body.nextCursor, null);
  },
);
