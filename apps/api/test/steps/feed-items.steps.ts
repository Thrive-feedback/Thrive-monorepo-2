import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import type { ThriveWorld } from '../support/world';

/** What a Member read of Home one item at a time, in the order they read it. */
const readThroughHome = new WeakMap<ThriveWorld, readonly string[]>();

interface HomeItem {
  readonly message: string;
  readonly visibility: string;
  readonly request: {
    readonly message: string;
    readonly requester: { readonly accountId: string };
    readonly asked: readonly HomeAsk[];
  } | null;
}

interface HomeAsk {
  readonly person: { readonly accountId: string };
  readonly status: string;
  readonly answer: { readonly message: string } | null;
}

/** What one read of a list to the end was given, page after page, for the step after it. */
export const readToTheEnd = new WeakMap<ThriveWorld, string[]>();

function homeItems(world: ThriveWorld): HomeItem[] {
  const items: HomeItem[] | undefined = world.lastResponse?.body?.items;
  assert.ok(items, 'Nothing was read from Home.');
  return items;
}

function homeItemSaying(world: ThriveWorld, message: string): HomeItem {
  const item = homeItems(world).find((each) => each.message === message);
  assert.ok(item, `"${message}" is not on Home.`);
  return item;
}

/** One person among those the first answer on Home says were asked. */
function askShownFor(world: ThriveWorld, name: string): HomeAsk {
  const [item] = homeItems(world);
  assert.ok(item?.request, 'That piece answers no request.');
  const ask = item.request.asked.find(
    (each) => each.person.accountId === world.person(name).accountId,
  );
  assert.ok(ask, `${name} is not named as asked.`);
  return ask;
}

function looksAtHome(world: ThriveWorld, name: string, query: string) {
  return world.as(
    name,
    'GET',
    `/v1/workspaces/${world.workspaceOf(name)}/feed-items${query}`,
  );
}

When(
  '{person} looks at All Feedback on Home',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(await looksAtHome(this, name, ''), `${name} reading Home`);
  },
);

When(
  '{person} looks at Everyone in the Workspace on Home',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await looksAtHome(this, name, '?show=EVERYONE'),
      `${name} reading Everyone in the Workspace`,
    );
  },
);

When(
  '{person} looks at Shared with me on Home',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await looksAtHome(this, name, '?show=SHARED_WITH_ME'),
      `${name} reading Shared with me`,
    );
  },
);

When(
  '{person} looks at Home showing {string}',
  async function (this: ThriveWorld, name: string, show: string) {
    await looksAtHome(this, name, `?show=${show}`);
  },
);

When(
  "{person} signs in and looks at Home in {person}'s Workspace",
  async function (this: ThriveWorld, outsider: string, member: string) {
    if (!this.isSignedIn(outsider)) {
      await this.signIn(outsider);
    }
    await this.as(
      outsider,
      'GET',
      `/v1/workspaces/${this.workspaceOf(member)}/feed-items`,
    );
  },
);

When(
  '{person} reads Home two at a time to the end',
  async function (this: ThriveWorld, name: string) {
    const messages: string[] = [];
    let cursor: string | null = null;
    do {
      const query: string = cursor === null ? '' : `&cursor=${cursor}`;
      const page = this.succeeded(
        await looksAtHome(this, name, `?limit=2${query}`),
        `${name} reading a page of Home`,
      );
      messages.push(...homeItems(this).map((item) => item.message));
      cursor = page.body.nextCursor;
    } while (cursor !== null);
    readToTheEnd.set(this, messages);
  },
);

Then(
  "{person}'s Home reads {string}",
  function (this: ThriveWorld, _name: string, message: string) {
    assert.deepEqual(
      homeItems(this).map((item) => item.message),
      [message],
    );
  },
);

Then(
  "{person}'s Home reads {string} then {string}",
  function (this: ThriveWorld, _name: string, first: string, second: string) {
    assert.deepEqual(
      homeItems(this).map((item) => item.message),
      [first, second],
    );
  },
);

Then(
  "{person}'s Home reads {string} then {string} then {string}",
  function (
    this: ThriveWorld,
    _name: string,
    first: string,
    second: string,
    third: string,
  ) {
    const items: readonly { message: string }[] =
      this.lastResponse?.body?.items ?? [];
    assert.deepEqual(
      items.map((item) => item.message),
      [first, second, third],
    );
  },
);

Then(
  "{person}'s Home shows a Kudos on its card",
  function (this: ThriveWorld, _name: string) {
    const [item] = this.lastResponse?.body?.items ?? [];
    assert.equal(item?.kind, 'KUDOS');
    assert.ok(item?.card, 'The Kudos came with no card.');
  },
);

Then(
  "{person}'s Home holds {int} Kudos",
  function (this: ThriveWorld, _name: string, count: number) {
    const items: readonly { kind: string }[] =
      this.lastResponse?.body?.items ?? [];
    assert.equal(items.filter((item) => item.kind === 'KUDOS').length, count);
  },
);

When(
  '{person} reads Home one item at a time',
  async function (this: ThriveWorld, name: string) {
    const read: string[] = [];
    let cursor: string | null = null;
    do {
      const query: string = cursor ? `&cursor=${cursor}` : '';
      const page = this.succeeded(
        await this.as(
          name,
          'GET',
          `/v1/workspaces/${this.workspaceOf(name)}/feed-items?limit=1${query}`,
        ),
        `${name} reading Home`,
      );
      read.push(
        ...page.body.items.map((item: { message: string }) => item.message),
      );
      cursor = page.body.nextCursor;
    } while (cursor !== null);
    readThroughHome.set(this, read);
  },
);

Then(
  '{person} read {string} then {string} then {string} then {string}',
  function (
    this: ThriveWorld,
    _name: string,
    first: string,
    second: string,
    third: string,
    fourth: string,
  ) {
    assert.deepEqual(readThroughHome.get(this), [first, second, third, fourth]);
  },
);

Then("{person}'s Home is empty", function (this: ThriveWorld, _name: string) {
  assert.deepEqual(homeItems(this), []);
  assert.equal(this.lastResponse?.body.nextCursor, null);
});

Then(
  'it answers {string}, asked by {person}',
  function (this: ThriveWorld, question: string, requester: string) {
    const [item] = homeItems(this);
    assert.equal(item?.request?.message, question);
    assert.equal(
      item?.request?.requester.accountId,
      this.person(requester).accountId,
    );
  },
);

Then(
  '{person} is shown as having answered {string}',
  function (this: ThriveWorld, name: string, message: string) {
    const ask = askShownFor(this, name);
    assert.equal(ask.status, 'ANSWERED');
    assert.equal(ask.answer?.message, message);
  },
);

Then(
  '{person} is shown as not having answered yet',
  function (this: ThriveWorld, name: string) {
    const ask = askShownFor(this, name);
    assert.equal(ask.status, 'PENDING');
    assert.equal(ask.answer, null);
  },
);

Then(
  "{person}'s Home is told it is being read by {person}",
  function (this: ThriveWorld, _name: string, reader: string) {
    assert.equal(
      this.lastResponse?.body.readerAccountId,
      this.person(reader).accountId,
    );
  },
);

Then(
  '{string} can be read by everyone in the Workspace',
  function (this: ThriveWorld, message: string) {
    assert.equal(homeItemSaying(this, message).visibility, 'EVERYONE');
  },
);

Then(
  '{string} can be read by the people selected',
  function (this: ThriveWorld, message: string) {
    assert.equal(homeItemSaying(this, message).visibility, 'SELECTED_PEOPLE');
  },
);

Then(
  '{person} has read {string} then {string} then {string} with nothing repeated',
  function (
    this: ThriveWorld,
    _name: string,
    first: string,
    second: string,
    third: string,
  ) {
    assert.deepEqual(readToTheEnd.get(this), [first, second, third]);
  },
);

Then('Home refuses the choice', function (this: ThriveWorld) {
  this.refusedWith('REQUEST_INVALID');
});
