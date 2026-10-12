import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { harness } from '../support/harness';
import {
  accept,
  invitationIdEmailedTo,
  invite,
  joinWorkspaceOf,
  myMemberships,
} from '../support/journeys';
import type { ThriveWorld } from '../support/world';

Given(
  "{person} is a Member of {person}'s Workspace",
  async function (this: ThriveWorld, name: string, owner: string) {
    await joinWorkspaceOf(this, name, owner);
  },
);

Given(
  '{person} has invited {person}',
  async function (this: ThriveWorld, inviter: string, invitee: string) {
    this.succeeded(
      await invite(this, inviter, invitee),
      `${inviter} inviting ${invitee}`,
    );
  },
);

Given(
  "{person} has revoked {person}'s Invitation",
  async function (this: ThriveWorld, owner: string, invitee: string) {
    const invitationId = invitationIdEmailedTo(this, invitee);
    this.succeeded(
      await this.as(
        owner,
        'POST',
        `/v1/workspaces/${this.workspaceOf(owner)}/invitations/${invitationId}/revoke`,
      ),
      `${owner} revoking ${invitee}'s Invitation`,
    );
  },
);

When(
  '{person} invites {person}',
  async function (this: ThriveWorld, inviter: string, invitee: string) {
    await invite(this, inviter, invitee);
  },
);

When(
  '{person} accepts the Invitation',
  async function (this: ThriveWorld, name: string) {
    await accept(this, name, invitationIdEmailedTo(this, name));
  },
);

When(
  "{person} accepts {person}'s Invitation",
  async function (this: ThriveWorld, name: string, invitee: string) {
    await accept(this, name, invitationIdEmailedTo(this, invitee));
  },
);

Then(
  '{person} is emailed an Invitation to {string}',
  function (this: ThriveWorld, invitee: string, workspaceName: string) {
    const { email } = this.person(invitee);
    const sent = harness().emailSender.sent.filter(
      (message) => message.to === email,
    );
    assert.equal(
      sent.length,
      1,
      `Expected one email to ${invitee}, got ${sent.length}.`,
    );
    assert.match(sent[0]?.text ?? '', new RegExp(workspaceName));
    invitationIdEmailedTo(this, invitee);
  },
);

Then(
  "{person} sees {person}'s Invitation waiting to be accepted",
  async function (this: ThriveWorld, owner: string, invitee: string) {
    const response = this.succeeded(
      await this.as(
        owner,
        'GET',
        `/v1/workspaces/${this.workspaceOf(owner)}/invitations`,
      ),
      `${owner} listing Invitations`,
    );
    const items: { email: string; status: string }[] = response.body.items;
    assert.deepEqual(
      items.map((i) => [i.email, i.status]),
      [[this.person(invitee).email, 'PENDING']],
    );
  },
);

Then(
  '{person} is a Member of {string}',
  async function (this: ThriveWorld, name: string, workspaceName: string) {
    const memberships = await myMemberships(this, name);
    assert.deepEqual(
      memberships.map((m) => [m.workspace.name, m.role]),
      [[workspaceName, 'MEMBER']],
    );
  },
);

Then(
  '{person} is told they may not invite people',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('NOT_ALLOWED_TO_INVITE');
  },
);

Then(
  '{person} is told the Invitation was revoked',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('INVITATION_REVOKED');
  },
);

Then(
  '{person} is told the Invitation is not for them',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('INVITATION_NOT_FOR_YOU');
  },
);
