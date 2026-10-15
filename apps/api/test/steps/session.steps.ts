import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { googlePhotoUrlOf } from '../support/workspace.integration-fixtures';
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

Given(
  "{person}'s Google account has a photo",
  async function (this: ThriveWorld, name: string) {
    await this.fixtures.aGooglePhoto(this.person(name));
  },
);

Then(
  "{person} is told the session shows {person}'s Google photo",
  function (this: ThriveWorld, _asker: string, owner: string) {
    assert.equal(
      this.lastResponse?.body?.account?.photoUrl,
      googlePhotoUrlOf(this.person(owner)),
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

const HOUR_MS = 60 * 60 * 1000;

When(
  'a visitor starts signing in with Google',
  async function (this: ThriveWorld) {
    await this.anonymously('POST', '/v1/sessions/google', {});
  },
);

Then(
  'the visitor is sent to Google to choose an account',
  function (this: ThriveWorld) {
    const url = new URL(this.lastResponse?.body?.url);
    assert.equal(url.host, 'accounts.google.com');
    assert.equal(url.searchParams.get('prompt'), 'select_account');
  },
);

When(
  'a visitor asks which Workspaces they belong to',
  async function (this: ThriveWorld) {
    await this.anonymously('GET', '/v1/members/mine');
  },
);

Then('the visitor is told to sign in first', function (this: ThriveWorld) {
  assert.equal(this.lastResponse?.status, 401);
  this.refusedWith('NOT_SIGNED_IN');
});

Given(
  '{person} signed in more than a day ago',
  async function (this: ThriveWorld, name: string) {
    const account = await this.signIn(name);
    await this.fixtures.ageSession(account, 25 * HOUR_MS);
  },
);

Then(
  '{person} is told the session is due to be renewed',
  function (this: ThriveWorld, _name: string) {
    assert.equal(this.lastResponse?.body?.needsRefresh, true);
  },
);

When(
  "{person}'s session is renewed",
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(name, 'POST', '/v1/sessions/current/refresh'),
      `Renewing ${name}'s session`,
    );
  },
);

Then(
  "{person}'s session is no longer due to be renewed",
  async function (this: ThriveWorld, name: string) {
    // The same cookie the browser held before renewing: the session behind it moved forward.
    const response = await this.as(name, 'GET', '/v1/sessions/current');
    assert.equal(response.body?.needsRefresh, false);
  },
);
