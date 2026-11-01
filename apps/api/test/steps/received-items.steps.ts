import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
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
function messagesRead(world: ThriveWorld): string[] {
  return receivedItems(world).map(({ message, tags }) =>
    tags.mentions.reduce(
      (read, { slug, displayName }) =>
        read.replace(`@${slug}`, `@${displayName}`),
      message,
    ),
  );
}

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

When(
  '{person} reads Received two at a time to the end',
  async function (this: ThriveWorld, name: string) {
    const messages: string[] = [];
    let cursor: string | null = null;
    do {
      const query: string = cursor === null ? '' : `&cursor=${cursor}`;
      const page = this.succeeded(
        await looksAtReceived(this, name, `?limit=2${query}`),
        `${name} reading a page of Received`,
      );
      messages.push(...messagesRead(this));
      cursor = page.body.nextCursor;
    } while (cursor !== null);
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
