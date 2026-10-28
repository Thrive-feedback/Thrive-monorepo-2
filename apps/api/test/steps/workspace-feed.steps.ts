import assert from 'node:assert/strict';
import { defineParameterType, Then, When } from '@cucumber/cucumber';
import type { ThriveWorld } from '../support/world';

interface FeedItem {
  readonly message: string;
  readonly giver: { readonly accountId: string; readonly status: string };
  readonly receivers: readonly {
    readonly accountId: string;
    readonly status: string;
  }[];
  readonly request: {
    readonly message: string;
    readonly requester: { readonly accountId: string };
    readonly asked: readonly { readonly accountId: string }[];
  } | null;
}

function feedItemSaying(world: ThriveWorld, message: string): FeedItem {
  const item = feedItems(world).find(
    (feedback) => feedback.message === message,
  );
  assert.ok(item, `"${message}" is not on the Workspace feed.`);
  return item;
}

/** How a person is shown: `inactive` while they are Deactivated in the Workspace. */
defineParameterType({
  name: 'personStatus',
  regexp: /active|inactive/,
  transformer: (shown: string) =>
    shown === 'inactive' ? 'DEACTIVATED' : 'ACTIVE',
});

function feedItems(world: ThriveWorld): FeedItem[] {
  const items: FeedItem[] | undefined = world.lastResponse?.body?.items;
  assert.ok(items, 'Nothing was read from the Workspace feed.');
  return items;
}

When(
  '{person} looks at the Workspace feed',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/feed`,
      ),
      `${name} reading their Workspace feed`,
    );
  },
);

When(
  "{person} signs in and looks at the feed of {person}'s Workspace",
  async function (this: ThriveWorld, outsider: string, member: string) {
    if (!this.isSignedIn(outsider)) {
      await this.signIn(outsider);
    }
    await this.as(
      outsider,
      'GET',
      `/v1/workspaces/${this.workspaceOf(member)}/feed`,
    );
  },
);

Then(
  '{person} reads {string} from {person} to {person} on the feed',
  function (
    this: ThriveWorld,
    _name: string,
    message: string,
    giver: string,
    receiver: string,
  ) {
    assert.deepEqual(
      feedItems(this).map((feedback) => [
        feedback.message,
        feedback.giver.accountId,
        feedback.receivers.map((named) => named.accountId),
      ]),
      [
        [
          message,
          this.person(giver).accountId,
          [this.person(receiver).accountId],
        ],
      ],
    );
  },
);

Then(
  '{person} reads on the feed that {string} answers {person}, who asked {people}: {string}',
  function (
    this: ThriveWorld,
    _name: string,
    answer: string,
    requester: string,
    asked: string[],
    question: string,
  ) {
    const { request } = feedItemSaying(this, answer);
    assert.ok(request, `"${answer}" answers no request on the feed.`);
    assert.deepEqual(
      [
        request.message,
        request.requester.accountId,
        request.asked.map((person) => person.accountId),
      ],
      [
        question,
        this.person(requester).accountId,
        asked.map((name) => this.person(name).accountId),
      ],
    );
  },
);

Then(
  '{person} reads on the feed that {string} answers no request',
  function (this: ThriveWorld, _name: string, message: string) {
    assert.equal(feedItemSaying(this, message).request, null);
  },
);

Then(
  'the Workspace feed is empty for {person}',
  function (this: ThriveWorld, _name: string) {
    assert.deepEqual(feedItems(this), []);
    assert.equal(this.lastResponse?.body.total, 0);
  },
);

Then(
  '{person} is told that Workspace cannot be found',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('WORKSPACE_NOT_FOUND');
  },
);

Then(
  '{person} reads {string} before {string} on the feed',
  function (this: ThriveWorld, _name: string, first: string, second: string) {
    assert.deepEqual(
      feedItems(this).map((feedback) => feedback.message),
      [first, second],
    );
  },
);

Then(
  '{person} sees {person} as {personStatus} on the feed',
  function (this: ThriveWorld, _name: string, person: string, status: string) {
    const accountId = this.person(person).accountId;
    const shown = feedItems(this).flatMap((feedback) =>
      [feedback.giver, ...feedback.receivers].filter(
        (named) => named.accountId === accountId,
      ),
    );
    assert.ok(shown.length > 0, `${person} is not named on the feed.`);
    assert.deepEqual(
      [...new Set(shown.map((named) => named.status))],
      [status],
    );
  },
);

Then(
  '{person} reads {string} from {person} to {people} on the feed',
  function (
    this: ThriveWorld,
    _name: string,
    message: string,
    giver: string,
    receivers: string[],
  ) {
    assert.deepEqual(
      feedItems(this).map((feedback) => [
        feedback.message,
        feedback.giver.accountId,
        feedback.receivers.map((person) => person.accountId),
      ]),
      [
        [
          message,
          this.person(giver).accountId,
          receivers.map((name) => this.person(name).accountId),
        ],
      ],
    );
  },
);
