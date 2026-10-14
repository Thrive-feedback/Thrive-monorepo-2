import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import { introduce } from '../support/journeys';
import type { ThriveWorld } from '../support/world';

When(
  '{person} introduces themselves',
  async function (this: ThriveWorld, name: string) {
    await introduce(this, name);
  },
);

Then(
  '{person} is known as {string}, with the full name {string}',
  async function (
    this: ThriveWorld,
    name: string,
    displayName: string,
    fullName: string,
  ) {
    const response = this.succeeded(
      await this.as(name, 'GET', '/v1/sessions/current'),
      `Reading ${name}'s session`,
    );
    const { profile } = response.body.account;
    assert.deepEqual(
      [profile?.displayName, profile?.fullName],
      [displayName, fullName],
    );
  },
);

Then(
  '{person} is told they have already introduced themselves',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('PROFILE_ALREADY_EXISTS');
  },
);
