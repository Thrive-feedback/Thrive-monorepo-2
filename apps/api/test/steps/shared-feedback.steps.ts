import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import type { ThriveWorld } from '../support/world';

interface SharedFeedbackItem {
  readonly body: string;
  readonly topic: string;
  readonly giver: { readonly accountId: string };
  readonly receiver: { readonly accountId: string };
}

function sharedItems(world: ThriveWorld): SharedFeedbackItem[] {
  const items: SharedFeedbackItem[] | undefined =
    world.lastResponse?.body?.items;
  assert.ok(items, 'Nothing was read from Shared with me.');
  return items;
}

When(
  '{person} looks at the Feedback shared with them',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/shared-feedback`,
      ),
      `${name} listing the Feedback shared with them`,
    );
  },
);

Then(
  '{person} reads {string} from {person} to {person} about {string}',
  function (
    this: ThriveWorld,
    _name: string,
    body: string,
    giver: string,
    receiver: string,
    topic: string,
  ) {
    assert.deepEqual(
      sharedItems(this).map((feedback) => [
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
  '{person} has no Feedback shared with them',
  function (this: ThriveWorld, _name: string) {
    assert.deepEqual(sharedItems(this), []);
    assert.equal(this.lastResponse?.body.total, 0);
  },
);

/** Any list of Feedback the last step read: Shared with me, or Feedback I've given. */
Then(
  '{person} reads about {string} before {string}',
  function (this: ThriveWorld, _name: string, first: string, second: string) {
    const items: { readonly topic: string }[] | undefined =
      this.lastResponse?.body?.items;
    assert.ok(items, 'No list of Feedback was read.');
    assert.deepEqual(
      items.map((feedback) => feedback.topic),
      [first, second],
    );
  },
);
