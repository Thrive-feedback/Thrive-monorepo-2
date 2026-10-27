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

Given(
  '{person} has given {people} Feedback: {string}',
  async function (
    this: ThriveWorld,
    giver: string,
    receivers: string[],
    message: string,
  ) {
    this.succeeded(
      await giveFeedback(this, giver, receivers, message),
      `${giver} giving ${receivers.join(' and ')} Feedback`,
    );
  },
);

Given(
  '{person} has given {people} Feedback: {string}, shared with {sharedWith}',
  async function (
    this: ThriveWorld,
    giver: string,
    receivers: string[],
    message: string,
    sharedWith: string,
  ) {
    this.succeeded(
      await giveFeedback(
        this,
        giver,
        receivers,
        message,
        visibilityOf(this, sharedWith),
      ),
      `${giver} giving ${receivers.join(' and ')} Feedback, shared with ${sharedWith}`,
    );
  },
);

When(
  '{person} gives {people} Feedback: {string}',
  async function (
    this: ThriveWorld,
    giver: string,
    receivers: string[],
    message: string,
  ) {
    await giveFeedback(this, giver, receivers, message);
  },
);

Then(
  '{person} finds {string} from {person}, written to them and {person}',
  async function (
    this: ThriveWorld,
    reader: string,
    message: string,
    giver: string,
    other: string,
  ) {
    const listed = this.succeeded(
      await this.as(
        reader,
        'GET',
        `/v1/workspaces/${this.workspaceOf(reader)}/feedback`,
      ),
      `${reader} listing the Feedback written to them`,
    );
    const items: {
      message: string;
      giverAccountId: string;
      otherReceivers: { accountId: string }[];
    }[] = listed.body.items;
    assert.deepEqual(
      items.map((feedback) => [
        feedback.message,
        feedback.giverAccountId,
        feedback.otherReceivers.map((person) => person.accountId),
      ]),
      [[message, this.person(giver).accountId, [this.person(other).accountId]]],
    );
  },
);

Then(
  '{person} reads it as written by {person} to {people}',
  function (
    this: ThriveWorld,
    _reader: string,
    giver: string,
    receivers: string[],
  ) {
    const feedback: {
      giver: { accountId: string };
      receivers: { accountId: string }[];
    } = this.succeeded(
      this.lastResponse as ApiResponse,
      'opening the Feedback',
    ).body;
    assert.deepEqual(
      [
        feedback.giver.accountId,
        feedback.receivers.map((person) => person.accountId),
      ],
      [
        this.person(giver).accountId,
        receivers.map((name) => this.person(name).accountId),
      ],
    );
  },
);

Then(
  '{person} has been given no Feedback',
  async function (this: ThriveWorld, name: string) {
    const listed = this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/feedback`,
      ),
      `${name} listing the Feedback written to them`,
    );
    assert.deepEqual(listed.body.items, []);
  },
);
