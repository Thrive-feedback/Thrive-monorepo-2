import assert from 'node:assert/strict';
import { defineParameterType, Then } from '@cucumber/cucumber';
import type { ThriveWorld } from '../support/world';

/** One piece of Feedback in a list that says which request it answers, if any. */
interface AnsweringItem {
  readonly message: string;
  readonly request: {
    readonly message: string;
    readonly requester: { readonly accountId: string };
    readonly asked: readonly { readonly accountId: string }[];
  } | null;
}

/** The lists that say what an answer answers, as a scenario names them. */
defineParameterType({
  name: 'answerList',
  regexp:
    /on the feed|in the Feedback written to them|in the Feedback shared with them/,
  transformer: (where: string) => where,
});

function itemSaying(
  world: ThriveWorld,
  where: string,
  message: string,
): AnsweringItem {
  const items: AnsweringItem[] | undefined = world.lastResponse?.body?.items;
  assert.ok(items, `Nothing was read ${where}.`);
  const item = items.find((feedback) => feedback.message === message);
  assert.ok(item, `"${message}" is not ${where}.`);
  return item;
}

Then(
  '{person} reads {answerList} that {string} answers {person}, who asked {people}: {string}',
  function (
    this: ThriveWorld,
    _name: string,
    where: string,
    answer: string,
    requester: string,
    asked: string[],
    question: string,
  ) {
    const { request } = itemSaying(this, where, answer);
    assert.ok(request, `"${answer}" answers no request ${where}.`);
    assert.deepEqual(
      [
        request.message,
        request.requester.accountId,
        request.asked.map((person) => person.accountId),
      ],
      [
        question,
        this.person(requester).accountId,
        asked.map((name) => this.person(name).accountId),
      ],
    );
  },
);

Then(
  '{person} reads {answerList} that {string} answers no request',
  function (this: ThriveWorld, _name: string, where: string, message: string) {
    assert.equal(itemSaying(this, where, message).request, null);
  },
);
