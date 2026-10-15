import assert from 'node:assert/strict';
import { defineParameterType, Given, Then, When } from '@cucumber/cucumber';
import {
  answerTheirAsk,
  askForFeedback,
  askIdWaitingFor,
  type VisibilityChosen,
} from '../support/journeys';
import type { ThriveWorld } from '../support/world';

/**
 * Who a Requester shares a request with, in the words the feature file uses: nobody else,
 * everyone in the Workspace, or the people they pick by name. Names stay names here and become
 * Accounts in `visibilityOf`, once the scenario has signed them in.
 */
defineParameterType({
  name: 'sharedWith',
  regexp:
    /nobody else|everyone in the Workspace|[A-Z][a-z]+(?: and [A-Z][a-z]+)*/,
});

function visibilityOf(
  world: ThriveWorld,
  sharedWith: string,
): VisibilityChosen {
  if (sharedWith === 'nobody else') {
    return { visibility: 'ONLY_ME' };
  }
  if (sharedWith === 'everyone in the Workspace') {
    return { visibility: 'EVERYONE' };
  }
  return {
    visibility: 'SELECTED_PEOPLE',
    selectedAccountIds: sharedWith
      .split(' and ')
      .map((name) => world.person(name).accountId),
  };
}

/** The answer the `When` step just got, which must have been a success. */
function lastSucceeded(world: ThriveWorld, what: string) {
  assert.ok(world.lastResponse, 'Nothing was asked of the API.');
  return world.succeeded(world.lastResponse, what);
}

function openFeedback(world: ThriveWorld, name: string) {
  assert.ok(world.feedback, 'No Feedback was written in this scenario.');
  const { id, workspaceId } = world.feedback;
  return world.as(name, 'GET', `/v1/workspaces/${workspaceId}/feedback/${id}`);
}

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

When(
  '{person} opens the Ask waiting for {person}',
  async function (this: ThriveWorld, opener: string, giver: string) {
    const askId = await askIdWaitingFor(this, giver);
    await this.as(
      opener,
      'GET',
      `/v1/workspaces/${this.workspaceOf(opener)}/feedback-asks/${askId}`,
    );
  },
);

Then(
  '{person} is told the Ask cannot be found',
  function (this: ThriveWorld, _name: string) {
    // An Ask is read through its own Giver, so one addressed to somebody else is not found —
    // the same answer the Requester gets, who reads the request itself instead.
    assert.equal(this.lastResponse?.status, 404);
    this.refusedWith('FEEDBACK_ASK_NOT_FOUND');
  },
);

Then(
  '{person} has nothing waiting for them',
  function (this: ThriveWorld, _name: string) {
    assert.deepEqual(this.lastResponse?.body.items, []);
    assert.equal(this.lastResponse?.body.total, 0);
  },
);

Given(
  '{person} has answered {string}',
  async function (this: ThriveWorld, giver: string, body: string) {
    this.succeeded(
      await answerTheirAsk(this, giver, body),
      `${giver} answering their Ask`,
    );
  },
);

When(
  '{person} answers {string}',
  async function (this: ThriveWorld, giver: string, body: string) {
    await answerTheirAsk(this, giver, body);
  },
);

When(
  '{person} answers the Ask waiting for {person}',
  async function (this: ThriveWorld, opener: string, giver: string) {
    const askId = await askIdWaitingFor(this, giver);
    await this.as(
      opener,
      'POST',
      `/v1/workspaces/${this.workspaceOf(opener)}/feedback-asks/${askId}/answers`,
      { body: 'Something I was never asked for.' },
    );
  },
);

Then(
  '{person} reads {string} on the request about {string}',
  async function (
    this: ThriveWorld,
    name: string,
    body: string,
    topic: string,
  ) {
    const response = this.succeeded(
      await openFeedbackRequest(this, name),
      `${name} opening the Feedback request`,
    );
    assert.equal(response.body.topic, topic);
    assert.deepEqual(
      response.body.asks.map(
        (ask: { answer: { body: string } | null; status: string }) => [
          ask.answer?.body ?? null,
          ask.status,
        ],
      ),
      [[body, 'ANSWERED']],
    );
  },
);

Then(
  '{person} is told the Ask has already been answered',
  function (this: ThriveWorld, _name: string) {
    assert.equal(this.lastResponse?.status, 409);
    this.refusedWith('ASK_ALREADY_ANSWERED');
  },
);

Then(
  '{person} is told {person} is not in their Workspace',
  function (this: ThriveWorld, _name: string, _giver: string) {
    this.refusedWith('GIVER_NOT_IN_WORKSPACE');
  },
);

When(
  '{person} looks at what they have answered',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/feedback-asks?status=ANSWERED`,
      ),
      `${name} listing what they have answered`,
    );
  },
);

Then(
  '{person} sees an Ask from {person} about {string} that they have answered',
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
      [[topic, this.person(requester).accountId, 'ANSWERED']],
    );
  },
);

When(
  '{person} looks at the Feedback written to them',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/feedback`,
      ),
      `${name} listing the Feedback written to them`,
    );
  },
);

Then(
  '{person} reads {string} from {person} about {string}',
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
    }[] = this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((feedback) => [
        feedback.body,
        feedback.giverAccountId,
        feedback.topic,
      ]),
      [[body, this.person(giver).accountId, topic]],
    );
  },
);

Then(
  '{person} has no Feedback written to them',
  function (this: ThriveWorld, _name: string) {
    assert.deepEqual(this.lastResponse?.body.items, []);
    assert.equal(this.lastResponse?.body.total, 0);
  },
);

Given(
  '{person} has asked {person} for Feedback on {string}, shared with {sharedWith}',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    topic: string,
    sharedWith: string,
  ) {
    this.succeeded(
      await askForFeedback(
        this,
        requester,
        giver,
        topic,
        visibilityOf(this, sharedWith),
      ),
      `${requester} asking ${giver} for Feedback, shared with ${sharedWith}`,
    );
  },
);

When(
  '{person} asks {person} for Feedback on {string}, shared with {sharedWith}',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    topic: string,
    sharedWith: string,
  ) {
    await askForFeedback(
      this,
      requester,
      giver,
      topic,
      visibilityOf(this, sharedWith),
    );
  },
);

When(
  '{person} asks {person} for Feedback on {string}, shared with selected people but picks nobody',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    topic: string,
  ) {
    await askForFeedback(this, requester, giver, topic, {
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [],
    });
  },
);

Then(
  '{person} is told to pick somebody to share it with',
  function (this: ThriveWorld, _name: string) {
    assert.equal(this.lastResponse?.status, 400);
    this.refusedWith('NO_PEOPLE_SELECTED');
  },
);

Then(
  '{person} is told they can only share it inside their Workspace',
  function (this: ThriveWorld, _name: string) {
    assert.equal(this.lastResponse?.status, 400);
    this.refusedWith('SELECTED_PERSON_NOT_IN_WORKSPACE');
  },
);

When(
  '{person} opens the Feedback {person} wrote',
  async function (this: ThriveWorld, name: string, _giver: string) {
    await openFeedback(this, name);
  },
);

Then(
  '{person} reads {string} written by {person}',
  function (this: ThriveWorld, name: string, body: string, giver: string) {
    const response = lastSucceeded(this, `${name} opening the Feedback`);
    assert.deepEqual(
      [response.body.body, response.body.giver.accountId],
      [body, this.person(giver).accountId],
    );
  },
);

Then(
  '{person} is told the Feedback cannot be found',
  function (this: ThriveWorld, _name: string) {
    // Outside the Workspace, the Workspace is not found; inside it but not chosen, the Feedback
    // is not found. Either way the caller learns nothing about it.
    assert.equal(this.lastResponse?.status, 404);
    assert.ok(
      ['WORKSPACE_NOT_FOUND', 'FEEDBACK_NOT_FOUND'].includes(
        this.lastResponse?.body?.error?.code,
      ),
      `Expected a not-found refusal, got ${JSON.stringify(this.lastResponse?.body)}`,
    );
  },
);

Then(
  '{person} sees it is shared with {sharedWith}',
  function (this: ThriveWorld, _name: string, sharedWith: string) {
    const response = lastSucceeded(this, 'Opening the Feedback request');
    const expected = visibilityOf(this, sharedWith);
    assert.deepEqual(
      [
        response.body.visibility.value,
        response.body.visibility.selectedPeople.map(
          (person: { accountId: string }) => person.accountId,
        ),
      ],
      [expected.visibility, expected.selectedAccountIds ?? []],
    );
  },
);

Then(
  '{person} is not told who else can read it',
  function (this: ThriveWorld, name: string) {
    const response = lastSucceeded(
      this,
      `${name} opening the Feedback request`,
    );
    assert.equal(response.body.visibility, null);
  },
);
