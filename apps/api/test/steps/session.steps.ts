import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { ThriveWorld } from '../support/world';

Given(
  '{person} is signed in',
  async function (this: ThriveWorld, name: string) {
    await this.signIn(name);
  },
);

When(
  '{person} asks who is signed in',
  async function (this: ThriveWorld, name: string) {
    await this.as(name, 'GET', '/v1/sessions/current');
  },
);

Then(
  "{person} is told the session is {person}'s",
  function (this: ThriveWorld, _asker: string, owner: string) {
    assert.equal(
      this.lastResponse?.body?.account?.email,
      this.person(owner).email,
    );
  },
);

When('{person} signs out', async function (this: ThriveWorld, name: string) {
  this.succeeded(
    await this.as(name, 'DELETE', '/v1/sessions/current'),
    `${name} signing out`,
  );
});

Then(
  '{person} is no longer signed in',
  async function (this: ThriveWorld, name: string) {
    // The same cookie the browser held: the session behind it has to be gone, not just forgotten.
    const response = await this.as(name, 'GET', '/v1/sessions/current');
    assert.equal(response.body?.account, null);
  },
);
