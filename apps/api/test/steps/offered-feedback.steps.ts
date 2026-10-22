import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { giveFeedback, visibilityOf } from '../support/journeys';
import type { ApiResponse, ThriveWorld } from '../support/world';

Given(
  '{person} has given {person} Feedback: {string}',
  async function (
    this: ThriveWorld,
    giver: string,
    receiver: string,
    message: string,
  ) {
    this.succeeded(
      await giveFeedback(this, giver, receiver, message),
      `${giver} giving ${receiver} Feedback`,
    );
  },
);

Given(
  '{person} has given {person} Feedback: {string}, shared with {sharedWith}',
  async function (
    this: ThriveWorld,
    giver: string,
    receiver: string,
    message: string,
    sharedWith: string,
  ) {
    this.succeeded(
      await giveFeedback(
        this,
        giver,
        receiver,
        message,
        visibilityOf(this, sharedWith),
      ),
      `${giver} giving ${receiver} Feedback, shared with ${sharedWith}`,
    );
  },
);

When(
  '{person} gives {person} Feedback: {string}',
  async function (
    this: ThriveWorld,
    giver: string,
    receiver: string,
    message: string,
  ) {
    await giveFeedback(this, giver, receiver, message);
  },
);

When(
  '{person} gives {person} Feedback: {string}, shared with {sharedWith}',
  async function (
    this: ThriveWorld,
    giver: string,
    receiver: string,
    message: string,
    sharedWith: string,
  ) {
    await giveFeedback(
      this,
      giver,
      receiver,
      message,
      visibilityOf(this, sharedWith),
    );
  },
);

Then(
  '{person} reads {string} from {person}, given without being asked',
  function (this: ThriveWorld, _name: string, message: string, giver: string) {
    const items: {
      message: string;
      giverAccountId: string;
      origin: string;
      feedbackRequestId: string | null;
    }[] = this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((feedback) => [
        feedback.message,
        feedback.giverAccountId,
        feedback.origin,
        feedback.feedbackRequestId,
      ]),
      [[message, this.person(giver).accountId, 'OFFERED', null]],
    );
  },
);

Then(
  'no Feedback request or Ask was made between {person} and {person}',
  async function (this: ThriveWorld, giver: string, receiver: string) {
    this.succeeded(
      this.lastResponse as ApiResponse,
      `${giver} giving Feedback`,
    );
    // Either of them could have been the one asking, so both directions are read.
    for (const [name, route] of [
      [giver, 'feedback-requests'],
      [giver, 'feedback-asks'],
      [receiver, 'feedback-requests'],
      [receiver, 'feedback-asks'],
    ] as const) {
      const listed = this.succeeded(
        await this.as(
          name,
          'GET',
          `/v1/workspaces/${this.workspaceOf(name)}/${route}`,
        ),
        `${name} listing their ${route}`,
      );
      assert.deepEqual(listed.body.items, [], `${name} has ${route}`);
    }
  },
);

Then(
  '{person} is told {person} is not in their Workspace to give Feedback to',
  function (this: ThriveWorld, _name: string, _receiver: string) {
    this.refusedWith('RECEIVER_NOT_IN_WORKSPACE');
  },
);
