import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import { visibilityOf } from '../support/journeys';
import type { ThriveWorld } from '../support/world';
import { readToTheEnd } from './feed-items.steps';
import { messagesRead } from './received-items.steps';

interface GivenAsk {
  readonly person: { readonly accountId: string };
  readonly status: string;
  readonly answer: unknown;
}

interface GivenItem {
  readonly visibility?: string;
  readonly request?: { readonly asked: readonly GivenAsk[] } | null;
}

function givenItems(world: ThriveWorld): GivenItem[] {
  const items: GivenItem[] | undefined = world.lastResponse?.body?.items;
  assert.ok(items, 'Nothing was read from Given.');
  return items;
}

function looksAtGiven(world: ThriveWorld, name: string, query: string) {
  return world.as(
    name,
    'GET',
    `/v1/workspaces/${world.workspaceOf(name)}/given-items${query}`,
  );
}

When(
  '{person} looks at what they have given',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(await looksAtGiven(this, name, ''), `${name} reading Given`);
  },
);

When(
  "{person} signs in and looks at what was given in {person}'s Workspace",
  async function (this: ThriveWorld, outsider: string, member: string) {
    if (!this.isSignedIn(outsider)) {
      await this.signIn(outsider);
    }
    await this.as(
      outsider,
      'GET',
      `/v1/workspaces/${this.workspaceOf(member)}/given-items`,
    );
  },
);

When(
  '{person} reads Given two at a time to the end',
  async function (this: ThriveWorld, name: string) {
    const messages: string[] = [];
    let cursor: string | null = null;
    do {
      const query: string = cursor === null ? '' : `&cursor=${cursor}`;
      const page = this.succeeded(
        await looksAtGiven(this, name, `?limit=2${query}`),
        `${name} reading a page of Given`,
      );
      messages.push(...messagesRead(this));
      cursor = page.body.nextCursor;
    } while (cursor !== null);
    readToTheEnd.set(this, messages);
  },
);

Then(
  "{person}'s Given reads {string}",
  function (this: ThriveWorld, _name: string, message: string) {
    assert.deepEqual(messagesRead(this), [message]);
  },
);

Then(
  "{person}'s Given reads {string} then {string} then {string}",
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

Then("{person}'s Given is empty", function (this: ThriveWorld, _name: string) {
  assert.deepEqual(givenItems(this), []);
  assert.equal(this.lastResponse?.body.nextCursor, null);
});

Then(
  "{person}'s Given says it is shared with {sharedWith}",
  function (this: ThriveWorld, _name: string, sharedWith: string) {
    const [item] = givenItems(this);
    assert.equal(item?.visibility, visibilityOf(this, sharedWith).visibility);
  },
);

Then(
  '{person} is shown as having answered, without what they wrote',
  function (this: ThriveWorld, name: string) {
    const [item] = givenItems(this);
    const ask = item?.request?.asked.find(
      (each) => each.person.accountId === this.person(name).accountId,
    );
    assert.ok(ask, `${name} is not named as asked.`);
    assert.equal(ask.status, 'ANSWERED');
    assert.equal(ask.answer, null);
  },
);
