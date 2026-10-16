import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import type { ThriveWorld } from '../support/world';

interface FeedItem {
  readonly body: string;
  readonly topic: string;
  readonly giver: { readonly accountId: string };
  readonly receiver: { readonly accountId: string };
}

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
  '{person} reads {string} from {person} to {person} about {string} on the feed',
  function (
    this: ThriveWorld,
    _name: string,
    body: string,
    giver: string,
    receiver: string,
    topic: string,
  ) {
    assert.deepEqual(
      feedItems(this).map((feedback) => [
        feedback.body,
        feedback.giver.accountId,
        feedback.receiver.accountId,
        feedback.topic,
      ]),
      [
        [
          body,
          this.person(giver).accountId,
          this.person(receiver).accountId,
          topic,
        ],
      ],
    );
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
  '{person} reads about {string} before {string} on the feed',
  function (this: ThriveWorld, _name: string, first: string, second: string) {
    assert.deepEqual(
      feedItems(this).map((feedback) => feedback.topic),
      [first, second],
    );
  },
);
