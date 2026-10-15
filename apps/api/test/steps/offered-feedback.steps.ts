import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { giveFeedback, visibilityOf } from '../support/journeys';
import type { ApiResponse, ThriveWorld } from '../support/world';

Given(
  '{person} has given {person} Feedback on {string}: {string}',
  async function (
    this: ThriveWorld,
    giver: string,
    receiver: string,
    topic: string,
    body: string,
  ) {
    this.succeeded(
      await giveFeedback(this, giver, receiver, topic, body),
      `${giver} giving ${receiver} Feedback`,
    );
  },
);

Given(
  '{person} has given {person} Feedback on {string}: {string}, shared with {sharedWith}',
  async function (
    this: ThriveWorld,
    giver: string,
    receiver: string,
    topic: string,
    body: string,
    sharedWith: string,
  ) {
    this.succeeded(
      await giveFeedback(
        this,
        giver,
        receiver,
        topic,
        body,
        visibilityOf(this, sharedWith),
      ),
      `${giver} giving ${receiver} Feedback, shared with ${sharedWith}`,
    );
  },
);

When(
  '{person} gives {person} Feedback on {string}: {string}',
  async function (
    this: ThriveWorld,
    giver: string,
    receiver: string,
    topic: string,
    body: string,
  ) {
    await giveFeedback(this, giver, receiver, topic, body);
  },
);

When(
  '{person} gives {person} Feedback on {string}: {string}, shared with {sharedWith}',
  async function (
    this: ThriveWorld,
    giver: string,
    receiver: string,
    topic: string,
    body: string,
    sharedWith: string,
  ) {
    await giveFeedback(
      this,
      giver,
      receiver,
      topic,
      body,
      visibilityOf(this, sharedWith),
    );
  },
);

Then(
  '{person} reads {string} from {person} about {string}, given without being asked',
  function (
    this: ThriveWorld,
    _name: string,
    body: string,
    giver: string,
    topic: string,
  ) {
    const items: {
      body: string;
      giverAccountId: string;
      topic: string;
      origin: string;
      feedbackRequestId: string | null;
    }[] = this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((feedback) => [
        feedback.body,
        feedback.giverAccountId,
        feedback.topic,
        feedback.origin,
        feedback.feedbackRequestId,
      ]),
      [[body, this.person(giver).accountId, topic, 'OFFERED', null]],
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
