import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import type { ThriveWorld } from '../support/world';

interface SharedFeedbackItem {
  readonly message: string;
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
  '{person} reads {string} from {person} to {person}',
  function (
    this: ThriveWorld,
    _name: string,
    message: string,
    giver: string,
    receiver: string,
  ) {
    assert.deepEqual(
      sharedItems(this).map((feedback) => [
        feedback.message,
        feedback.giver.accountId,
        feedback.receiver.accountId,
      ]),
      [
        [
          message,
          this.person(giver).accountId,
          this.person(receiver).accountId,
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

Then(
  '{person} reads {string} before {string}',
  function (this: ThriveWorld, _name: string, first: string, second: string) {
    assert.deepEqual(
      sharedItems(this).map((feedback) => feedback.message),
      [first, second],
    );
  },
);
