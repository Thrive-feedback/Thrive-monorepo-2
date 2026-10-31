import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import {
  answerTheirAsk,
  askForFeedback,
  giveFeedback,
} from '../support/journeys';
import type { ThriveWorld } from '../support/world';

const STICKER = {
  stickerKey: 'system/sticker-01-thumbs-up',
  side: 'front',
  x: 62.5,
  y: 40,
  scale: 1.25,
  rotation: -8,
};

const A_POSTCARD = {
  templateKey: 'system/postcard_template_2',
  tone: 'sage',
  textStyle: { font: 'classic', sizeStep: 3, align: 'center', ink: 'navy' },
  stickers: [
    STICKER,
    { ...STICKER, side: 'back', stickerKey: 'system/sticker-09-star' },
  ],
  stampKey: 'system/stamp-02-ocean',
};

const FOUR_STICKERS = [STICKER, STICKER, STICKER, STICKER];

const AN_ANSWERS_LOOK = {
  textStyle: { font: 'signature', sizeStep: 2, align: 'left', ink: 'navy' },
  stickers: [{ ...STICKER, side: 'back' }],
};

Given(
  '{person} has given {person} Feedback on a postcard: {string}',
  async function (
    this: ThriveWorld,
    giver: string,
    receiver: string,
    message: string,
  ) {
    this.succeeded(
      await giveFeedback(this, giver, receiver, message, undefined, A_POSTCARD),
      `${giver} giving ${receiver} Feedback on a postcard`,
    );
  },
);

Given(
  '{person} has asked {person} for Feedback on a postcard: {string}',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    message: string,
  ) {
    this.succeeded(
      await askForFeedback(
        this,
        requester,
        giver,
        message,
        undefined,
        A_POSTCARD,
      ),
      `${requester} asking ${giver} for Feedback on a postcard`,
    );
  },
);

When(
  '{person} gives {person} Feedback on a postcard with four stickers: {string}',
  async function (
    this: ThriveWorld,
    giver: string,
    receiver: string,
    message: string,
  ) {
    await giveFeedback(this, giver, receiver, message, undefined, {
      ...A_POSTCARD,
      stickers: FOUR_STICKERS,
    });
  },
);

When(
  '{person} asks {person} for Feedback on a postcard with four stickers: {string}',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    message: string,
  ) {
    await askForFeedback(this, requester, giver, message, undefined, {
      ...A_POSTCARD,
      stickers: FOUR_STICKERS,
    });
  },
);

Then(
  '{person} sees the postcard it was written on',
  function (this: ThriveWorld, name: string) {
    assert.equal(this.lastResponse?.status, 200, `${name} opening it`);
    assert.deepEqual(this.lastResponse?.body.postcard, A_POSTCARD);
  },
);

Then('{person} sees no postcard', function (this: ThriveWorld, name: string) {
  assert.equal(this.lastResponse?.status, 200, `${name} opening it`);
  assert.equal(this.lastResponse?.body.postcard, null);
});

Given(
  '{person} has answered on the postcard: {string}',
  async function (this: ThriveWorld, giver: string, message: string) {
    this.succeeded(
      await answerTheirAsk(this, giver, message, AN_ANSWERS_LOOK),
      `${giver} answering on the postcard`,
    );
  },
);

When(
  '{person} answers on the postcard with a sticker on its front: {string}',
  async function (this: ThriveWorld, giver: string, message: string) {
    await answerTheirAsk(this, giver, message, {
      ...AN_ANSWERS_LOOK,
      stickers: [STICKER],
    });
  },
);

When(
  '{person} answers choosing the picture of the postcard: {string}',
  async function (this: ThriveWorld, giver: string, message: string) {
    await answerTheirAsk(this, giver, message, {
      ...AN_ANSWERS_LOOK,
      templateKey: A_POSTCARD.templateKey,
    });
  },
);

Then('the request is refused as malformed', function (this: ThriveWorld) {
  this.refusedWith('REQUEST_INVALID');
});

Then(
  '{person} sees the postcard the request was written on',
  function (this: ThriveWorld, name: string) {
    assert.equal(this.lastResponse?.status, 200, `${name} opening it`);
    assert.deepEqual(this.lastResponse?.body.request.postcard, A_POSTCARD);
  },
);

Then(
  '{person} sees {string} as it was written on the postcard',
  function (this: ThriveWorld, name: string, message: string) {
    assert.equal(this.lastResponse?.status, 200, `${name} opening it`);
    const answer = this.lastResponse?.body.request.answers.find(
      (each: { message: string }) => each.message === message,
    );
    assert.deepEqual(answer?.postcard, AN_ANSWERS_LOOK);
  },
);

/** What is on the card somebody just opened, in the order it holds them. */
function answersOnTheCard(world: ThriveWorld, name: string): string[] {
  assert.equal(world.lastResponse?.status, 200, `${name} opening it`);
  assert.equal(
    world.lastResponse?.body.readerAccountId,
    world.person(name).accountId,
  );
  return world.lastResponse?.body.request.answers.map(
    (each: { message: string }) => each.message,
  );
}

Then(
  'the postcard {person} opened holds only {string}',
  function (this: ThriveWorld, name: string, message: string) {
    assert.deepEqual(answersOnTheCard(this, name), [message]);
  },
);

Then(
  'the postcard {person} opened holds {string} then {string}',
  function (this: ThriveWorld, name: string, first: string, second: string) {
    assert.deepEqual(answersOnTheCard(this, name), [first, second]);
  },
);

Then(
  '{person} is told the postcard cannot be sent',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('POSTCARD_INVALID');
  },
);
