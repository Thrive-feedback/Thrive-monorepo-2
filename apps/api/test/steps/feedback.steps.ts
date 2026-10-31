import assert from 'node:assert/strict';
import { defineParameterType, Given, Then, When } from '@cucumber/cucumber';
import {
  answerTheirAsk,
  askForFeedback,
  askIdWaitingFor,
  visibilityOf,
} from '../support/journeys';
import type { ThriveWorld } from '../support/world';

/**
 * Who a Requester or a Giver shares Feedback with, in the words the feature file uses: nobody
 * else, everyone in the Workspace, or the people they pick by name. Names stay names here and
 * become Accounts in `visibilityOf`, once the scenario has signed them in.
 */
defineParameterType({
  name: 'sharedWith',
  regexp:
    /nobody else|everyone in the Workspace|[A-Z][a-z]+(?: and [A-Z][a-z]+)*/,
});

/**
 * Two or more people named in one breath — "Ben and Cara" — as a Requester asks them. One name
 * alone is a `{person}`, so the two never match the same words.
 */
defineParameterType({
  name: 'people',
  regexp: /[A-Z][a-z]+(?: and [A-Z][a-z]+)+/,
  transformer: (names: string) => names.split(' and '),
});

/** The answer the `When` step just got, which must have been a success. */
function lastSucceeded(world: ThriveWorld, what: string) {
  assert.ok(world.lastResponse, 'Nothing was asked of the API.');
  return world.succeeded(world.lastResponse, what);
}

function openFeedback(world: ThriveWorld, name: string, giver: string) {
  const written = world.feedbackBy.get(giver);
  assert.ok(written, `${giver} wrote no Feedback in this scenario.`);
  const { id, workspaceId } = written;
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
  '{person} has asked {person} for Feedback: {string}',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    message: string,
  ) {
    this.succeeded(
      await askForFeedback(this, requester, giver, message),
      `${requester} asking ${giver} for Feedback`,
    );
  },
);

When(
  '{person} asks {person} for Feedback: {string}',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    message: string,
  ) {
    await askForFeedback(this, requester, giver, message);
  },
);

When(
  "{person} opens {person}'s Feedback request",
  async function (this: ThriveWorld, name: string, _requester: string) {
    await openFeedbackRequest(this, name);
  },
);

Then(
  '{person} can open the request saying {string}',
  async function (this: ThriveWorld, name: string, message: string) {
    const response = this.succeeded(
      await openFeedbackRequest(this, name),
      `${name} opening the Feedback request`,
    );
    assert.equal(response.body.message, message);
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
  '{person} sees a request saying {string} asking {person}',
  function (this: ThriveWorld, _name: string, message: string, giver: string) {
    const items: { message: string; asks: { giverAccountId: string }[] }[] =
      this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((request) => [
        request.message,
        request.asks.map((ask) => ask.giverAccountId),
      ]),
      [[message, [this.person(giver).accountId]]],
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
  '{person} sees an Ask from {person} saying {string} waiting for an answer',
  function (
    this: ThriveWorld,
    _name: string,
    requester: string,
    message: string,
  ) {
    const items: {
      message: string;
      requester: { accountId: string };
      status: string;
    }[] = this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((ask) => [ask.message, ask.requester.accountId, ask.status]),
      [[message, this.person(requester).accountId, 'PENDING']],
    );
  },
);

Then(
  '{person} can open the Ask saying {string}',
  async function (this: ThriveWorld, name: string, message: string) {
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
    assert.equal(opened.body.message, message);
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
      { message: 'Something I was never asked for.' },
    );
  },
);

Then(
  '{person} reads {string} on the request saying {string}',
  async function (
    this: ThriveWorld,
    name: string,
    body: string,
    message: string,
  ) {
    const response = this.succeeded(
      await openFeedbackRequest(this, name),
      `${name} opening the Feedback request`,
    );
    assert.equal(response.body.message, message);
    assert.deepEqual(
      response.body.asks.map(
        (ask: { answer: { message: string } | null; status: string }) => [
          ask.answer?.message ?? null,
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
  '{person} sees an Ask from {person} saying {string} that they have answered',
  function (
    this: ThriveWorld,
    _name: string,
    requester: string,
    message: string,
  ) {
    const items: {
      message: string;
      requester: { accountId: string };
      status: string;
    }[] = this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((ask) => [ask.message, ask.requester.accountId, ask.status]),
      [[message, this.person(requester).accountId, 'ANSWERED']],
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
  '{person} reads {string} from {person}',
  function (this: ThriveWorld, _name: string, message: string, giver: string) {
    const items: {
      message: string;
      giverAccountId: string;
    }[] = this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((feedback) => [feedback.message, feedback.giverAccountId]),
      [[message, this.person(giver).accountId]],
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
  '{person} has asked {person} for Feedback: {string}, shared with {sharedWith}',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    message: string,
    sharedWith: string,
  ) {
    this.succeeded(
      await askForFeedback(
        this,
        requester,
        giver,
        message,
        visibilityOf(this, sharedWith),
      ),
      `${requester} asking ${giver} for Feedback, shared with ${sharedWith}`,
    );
  },
);

When(
  '{person} asks {person} for Feedback: {string}, shared with {sharedWith}',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    message: string,
    sharedWith: string,
  ) {
    await askForFeedback(
      this,
      requester,
      giver,
      message,
      visibilityOf(this, sharedWith),
    );
  },
);

When(
  '{person} asks {person} for Feedback: {string}, shared with selected people but picks nobody',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    message: string,
  ) {
    await askForFeedback(this, requester, giver, message, {
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

Then(
  '{person} is told everyone it mentions must be able to read it',
  function (this: ThriveWorld, _name: string) {
    assert.equal(this.lastResponse?.status, 400);
    this.refusedWith('MENTIONED_PERSON_LEFT_OUT');
  },
);

When(
  '{person} opens the Feedback {person} wrote',
  async function (this: ThriveWorld, name: string, giver: string) {
    await openFeedback(this, name, giver);
  },
);

Then(
  '{person} reads {string} written by {person}',
  function (this: ThriveWorld, name: string, body: string, giver: string) {
    const response = lastSucceeded(this, `${name} opening the Feedback`);
    assert.deepEqual(
      [response.body.message, response.body.giver.accountId],
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

Given(
  '{person} has asked {people} for Feedback: {string}, shared with {sharedWith}',
  async function (
    this: ThriveWorld,
    requester: string,
    givers: string[],
    message: string,
    sharedWith: string,
  ) {
    this.succeeded(
      await askForFeedback(
        this,
        requester,
        givers,
        message,
        visibilityOf(this, sharedWith),
      ),
      `${requester} asking ${givers.join(' and ')} for Feedback, shared with ${sharedWith}`,
    );
  },
);

/** Whether an answer will be on the Workspace feed, in the words the feature file uses. */
defineParameterType({
  name: 'feedPlacement',
  regexp: /goes|does not go/,
  transformer: (placement: string) => placement === 'goes',
});

Then(
  '{person} is told their answer {feedPlacement} on the Workspace feed',
  function (this: ThriveWorld, name: string, onWorkspaceFeed: boolean) {
    const response = lastSucceeded(this, `${name} opening the Ask`);
    assert.equal(response.body.onWorkspaceFeed, onWorkspaceFeed);
  },
);

Given(
  '{person} has asked {people} for Feedback: {string}',
  async function (
    this: ThriveWorld,
    requester: string,
    givers: string[],
    message: string,
  ) {
    this.succeeded(
      await askForFeedback(this, requester, givers, message),
      `${requester} asking ${givers.join(' and ')} for Feedback`,
    );
  },
);

When(
  '{person} asks {people} for Feedback: {string}',
  async function (
    this: ThriveWorld,
    requester: string,
    givers: string[],
    message: string,
  ) {
    await askForFeedback(this, requester, givers, message);
  },
);

Then(
  '{person} sees a request saying {string} asking {people}',
  function (
    this: ThriveWorld,
    _name: string,
    message: string,
    givers: string[],
  ) {
    const items: { message: string; asks: { giverAccountId: string }[] }[] =
      this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((request) => [
        request.message,
        request.asks.map((ask) => ask.giverAccountId).sort(),
      ]),
      [[message, givers.map((giver) => this.person(giver).accountId).sort()]],
    );
  },
);

Then(
  '{person} sees only their own Ask on the request',
  function (this: ThriveWorld, name: string) {
    const response = lastSucceeded(
      this,
      `${name} opening the Feedback request`,
    );
    assert.deepEqual(
      response.body.asks.map(
        (ask: { giverAccountId: string }) => ask.giverAccountId,
      ),
      [this.person(name).accountId],
    );
  },
);

Then(
  '{person} has not been asked anything',
  async function (this: ThriveWorld, name: string) {
    const listed = this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/feedback-asks`,
      ),
      `${name} listing what they have been asked`,
    );
    assert.deepEqual(listed.body.items, []);
  },
);
