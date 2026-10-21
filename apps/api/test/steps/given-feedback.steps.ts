import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import type { ThriveWorld } from '../support/world';

interface GivenFeedbackItem {
  readonly body: string;
  readonly topic: string;
  readonly giver: { readonly accountId: string };
  readonly receiver: { readonly accountId: string };
}

function givenItems(world: ThriveWorld): GivenFeedbackItem[] {
  const items: GivenFeedbackItem[] | undefined =
    world.lastResponse?.body?.items;
  assert.ok(items, "Nothing was read from Feedback I've given.");
  return items;
}

When(
  '{person} looks at the Feedback they have given',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/given-feedback`,
      ),
      `${name} listing the Feedback they have given`,
    );
  },
);

Then(
  '{person} reads {string} to {person} about {string}',
  function (
    this: ThriveWorld,
    name: string,
    body: string,
    receiver: string,
    topic: string,
  ) {
    assert.deepEqual(
      givenItems(this).map((feedback) => [
        feedback.body,
        feedback.giver.accountId,
        feedback.receiver.accountId,
        feedback.topic,
      ]),
      [
        [
          body,
          this.person(name).accountId,
          this.person(receiver).accountId,
          topic,
        ],
      ],
    );
  },
);

Then(
  '{person} has given no Feedback',
  function (this: ThriveWorld, _name: string) {
    assert.deepEqual(givenItems(this), []);
    assert.equal(this.lastResponse?.body.total, 0);
  },
);
