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
    // Outside the Workspace, the Workspace itself is not found: nothing about it leaks (BE_21 R3).
    this.refusedWith('WORKSPACE_NOT_FOUND');
  },
);
