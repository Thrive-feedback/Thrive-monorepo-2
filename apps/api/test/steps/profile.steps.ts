import assert from 'node:assert/strict';
import { defineParameterType, Then, When } from '@cucumber/cucumber';
import { introduce, slugOf } from '../support/journeys';
import type { ApiResponse, ThriveWorld } from '../support/world';
import { messagesRead } from './received-items.steps';

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

/** Which of a Profile's two lists to read, in the feature's words, as the route names it. */
const PROFILE_LISTS: Readonly<Record<string, string>> = {
  Feedback: 'FEEDBACK',
  'Feedback shared with them': 'SHARED_WITH_ME',
  Kudos: 'KUDOS',
};

/** The Profile the last step opened, which has to have opened. */
function openedProfile(world: ThriveWorld, name: string): ApiResponse {
  assert.ok(world.lastResponse, `Nobody opened ${name}'s Profile.`);
  return world.succeeded(world.lastResponse, `Opening ${name}'s Profile`);
}

defineParameterType({
  name: 'profileList',
  // The longer phrase first, so "Feedback shared with them" is not read as "Feedback".
  regexp: /Feedback shared with them|Feedback|Kudos/,
  transformer: (list: string) => PROFILE_LISTS[list],
});

When(
  "{person} opens {person}'s Profile",
  async function (this: ThriveWorld, reader: string, name: string) {
    const slug = await slugOf(this, name);
    await this.as(
      reader,
      'GET',
      `/v1/workspaces/${this.workspaceOf(reader)}/profiles/${slug}`,
    );
  },
);

When(
  "{person} reads the {profileList} on {person}'s Profile",
  async function (
    this: ThriveWorld,
    reader: string,
    show: string,
    name: string,
  ) {
    const { accountId } = this.person(name);
    this.succeeded(
      await this.as(
        reader,
        'GET',
        `/v1/workspaces/${this.workspaceOf(reader)}/members/${accountId}/profile-items?show=${show}`,
      ),
      `${reader} reading ${show} on ${name}'s Profile`,
    );
  },
);

Then(
  'the Profile names {person} {string}, with the full name {string}, as an {word}',
  function (
    this: ThriveWorld,
    name: string,
    displayName: string,
    fullName: string,
    role: string,
  ) {
    const response = openedProfile(this, name);
    assert.deepEqual(
      [
        response.body.displayName,
        response.body.fullName,
        response.body.role,
        response.body.status,
      ],
      [displayName, fullName, role.toUpperCase(), 'ACTIVE'],
    );
  },
);

Then(
  'the Profile shows {person} as Deactivated',
  function (this: ThriveWorld, name: string) {
    const response = openedProfile(this, name);
    assert.equal(response.body.status, 'DEACTIVATED');
  },
);

Then(
  '{person} is told there is no such Profile',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('PROFILE_NOT_FOUND');
  },
);

Then(
  'the Profile reads {string}',
  function (this: ThriveWorld, message: string) {
    assert.deepEqual(messagesRead(this), [message]);
  },
);

Then(
  'the Profile reads {string} then {string}',
  function (this: ThriveWorld, first: string, second: string) {
    assert.deepEqual(messagesRead(this), [first, second]);
  },
);

Then('the Profile reads nothing', function (this: ThriveWorld) {
  assert.deepEqual(messagesRead(this), []);
});
