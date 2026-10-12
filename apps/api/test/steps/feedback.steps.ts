import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { askForFeedback } from '../support/journeys';
import type { ThriveWorld } from '../support/world';

function openFeedbackRequest(world: ThriveWorld, name: string) {
  assert.ok(
    world.feedbackRequest,
    'No Feedback request was sent in this scenario.',
  );
  const { id, workspaceId } = world.feedbackRequest;
  return world.as(
    name,
    'GET',
    `/v1/workspaces/${workspaceId}/feedback-requests/${id}`,
  );
}

Given(
  '{person} has asked {person} for Feedback on {string}',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    topic: string,
  ) {
    this.succeeded(
      await askForFeedback(this, requester, giver, topic),
      `${requester} asking ${giver} for Feedback`,
    );
  },
);

When(
  '{person} asks {person} for Feedback on {string}',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    topic: string,
  ) {
    await askForFeedback(this, requester, giver, topic);
  },
);

When(
  "{person} opens {person}'s Feedback request",
  async function (this: ThriveWorld, name: string, _requester: string) {
    await openFeedbackRequest(this, name);
  },
);

Then(
  '{person} can open the request about {string}',
  async function (this: ThriveWorld, name: string, topic: string) {
    const response = this.succeeded(
      await openFeedbackRequest(this, name),
      `${name} opening the Feedback request`,
    );
    assert.equal(response.body.topic, topic);
  },
);

Then(
  '{person} is told it cannot be found',
  function (this: ThriveWorld, _name: string) {
    // Outside the Workspace, the Workspace is not found; inside it but not a party, the request
    // is not found. Either way the caller learns nothing about it (ADR 0037, ADR 0039).
    assert.equal(this.lastResponse?.status, 404);
    assert.ok(
      ['WORKSPACE_NOT_FOUND', 'FEEDBACK_REQUEST_NOT_FOUND'].includes(
        this.lastResponse?.body?.error?.code,
      ),
      `Expected a not-found refusal, got ${JSON.stringify(this.lastResponse?.body)}`,
    );
  },
);

When(
  '{person} looks at the requests they have sent',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/feedback-requests`,
      ),
      `${name} listing the requests they sent`,
    );
  },
);

Then(
  '{person} sees a request about {string} asking {person}',
  function (this: ThriveWorld, _name: string, topic: string, giver: string) {
    const items: { topic: string; asks: { giverAccountId: string }[] }[] =
      this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((request) => [
        request.topic,
        request.asks.map((ask) => ask.giverAccountId),
      ]),
      [[topic, [this.person(giver).accountId]]],
    );
  },
);

When(
  '{person} looks at what they have been asked',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/feedback-asks`,
      ),
      `${name} listing what they have been asked`,
    );
  },
);

Then(
  '{person} sees an Ask from {person} about {string} waiting for an answer',
  function (
    this: ThriveWorld,
    _name: string,
    requester: string,
    topic: string,
  ) {
    const items: {
      topic: string;
      requester: { accountId: string };
      status: string;
    }[] = this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((ask) => [ask.topic, ask.requester.accountId, ask.status]),
      [[topic, this.person(requester).accountId, 'PENDING']],
    );
  },
);

Then(
  '{person} can open the Ask about {string}',
  async function (this: ThriveWorld, name: string, topic: string) {
    const workspaceId = this.workspaceOf(name);
    const listed = this.succeeded(
      await this.as(name, 'GET', `/v1/workspaces/${workspaceId}/feedback-asks`),
      `${name} listing what they have been asked`,
    );
    const askId: string | undefined = listed.body.items[0]?.askId;
    assert.ok(askId, `${name} has no Ask to open.`);
    const opened = this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${workspaceId}/feedback-asks/${askId}`,
      ),
      `${name} opening the Ask`,
    );
    assert.equal(opened.body.topic, topic);
  },
);
