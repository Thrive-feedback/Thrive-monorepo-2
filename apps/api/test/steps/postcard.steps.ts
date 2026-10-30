import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { askForFeedback, giveFeedback } from '../support/journeys';
import type { ThriveWorld } from '../support/world';

const STAMP = {
  stampKey: 'system/stamp-02-ocean',
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
  stamps: [
    STAMP,
    { ...STAMP, side: 'back', stampKey: 'system/stamp-03-night' },
  ],
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
  '{person} gives {person} Feedback on a postcard with four stamps: {string}',
  async function (
    this: ThriveWorld,
    giver: string,
    receiver: string,
    message: string,
  ) {
    await giveFeedback(this, giver, receiver, message, undefined, {
      ...A_POSTCARD,
      stamps: [STAMP, STAMP, STAMP, STAMP],
    });
  },
);

When(
  '{person} asks {person} for Feedback on a postcard with four stamps: {string}',
  async function (
    this: ThriveWorld,
    requester: string,
    giver: string,
    message: string,
  ) {
    await askForFeedback(this, requester, giver, message, undefined, {
      ...A_POSTCARD,
      stamps: [STAMP, STAMP, STAMP, STAMP],
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

Then(
  '{person} is told the postcard cannot be sent',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('POSTCARD_INVALID');
  },
);
