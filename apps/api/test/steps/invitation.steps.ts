import assert from 'node:assert/strict';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { harness } from '../support/harness';
import {
  accept,
  invitationIdEmailedTo,
  invite,
  joinWorkspaceOf,
  myInvitations,
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

/** `name` revokes the Invitation emailed to `invitee`, from their own Workspace's list. */
function revoke(world: ThriveWorld, name: string, invitee: string) {
  return world.as(
    name,
    'POST',
    `/v1/workspaces/${world.workspaceOf(name)}/invitations/${invitationIdEmailedTo(world, invitee)}/revoke`,
  );
}

/** The Invitation `invitee` holds: one written to the store, or else the one emailed to them. */
function invitationIdHeldBy(world: ThriveWorld, invitee: string): string {
  return (
    world.storedInvitationTo(invitee) ?? invitationIdEmailedTo(world, invitee)
  );
}

Given(
  "{person} has revoked {person}'s Invitation",
  async function (this: ThriveWorld, owner: string, invitee: string) {
    this.succeeded(
      await revoke(this, owner, invitee),
      `${owner} revoking ${invitee}'s Invitation`,
    );
  },
);

When(
  "{person} revokes {person}'s Invitation",
  async function (this: ThriveWorld, name: string, invitee: string) {
    await revoke(this, name, invitee);
  },
);

Given(
  '{person} has accepted the Invitation',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await accept(this, name, invitationIdHeldBy(this, name)),
      `${name} accepting the Invitation`,
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
    await accept(this, name, invitationIdHeldBy(this, name));
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

When(
  '{person} looks for Invitations waiting for them',
  async function (this: ThriveWorld, name: string) {
    await myInvitations(this, name);
  },
);

When(
  '{person} joins {string} from the Invitations waiting for them',
  async function (this: ThriveWorld, name: string, workspaceName: string) {
    const chosen = (await myInvitations(this, name)).find(
      (invitation) => invitation.workspace.name === workspaceName,
    );
    assert.ok(chosen, `${name} was not offered ${workspaceName}.`);
    await accept(this, name, chosen.invitationId);
  },
);

Then(
  '{person} is offered these Workspaces, newest first:',
  function (this: ThriveWorld, _name: string, table: DataTable) {
    const items: { workspace: { name: string; memberCount: number } }[] =
      this.lastResponse?.body.items;
    assert.deepEqual(
      items.map((i) => [i.workspace.name, String(i.workspace.memberCount)]),
      table.hashes().map((row) => [row.Workspace, row.Members]),
    );
  },
);

Then(
  '{person} is offered no Workspaces',
  function (this: ThriveWorld, _name: string) {
    assert.deepEqual(this.lastResponse?.body.items, []);
  },
);

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** An Invitation from `inviter` to `invitee`, written to the store as if sent at `sentAt`. */
async function storeInvitation(
  world: ThriveWorld,
  inviter: string,
  invitee: string,
  sentAt: Date,
): Promise<void> {
  const invitationId = await world.fixtures.anInvitation(
    world.workspaceOf(inviter),
    world.person(inviter),
    {
      email: world.person(invitee).email,
      createdAt: sentAt,
      expiresAt: new Date(sentAt.getTime() + 7 * DAY_MS),
    },
  );
  world.invitationStoredFor(invitee, invitationId);
}

/** `owner`'s view of the Invitation to `invitee`, as the Members screen lists it. */
async function listedInvitationTo(
  world: ThriveWorld,
  owner: string,
  invitee: string,
): Promise<{
  status: string;
  expiresAt: string;
  invitedBy: { displayName: string | null; email: string };
}> {
  const response = world.succeeded(
    await world.as(
      owner,
      'GET',
      `/v1/workspaces/${world.workspaceOf(owner)}/invitations`,
    ),
    `${owner} listing Invitations`,
  );
  const { email } = world.person(invitee);
  const listed = response.body.items.find(
    (item: { email: string }) => item.email === email,
  );
  assert.ok(listed, `${owner} does not see an Invitation to ${invitee}.`);
  return listed;
}

Given(
  '{person} invited {person} an hour ago',
  async function (this: ThriveWorld, inviter: string, invitee: string) {
    await storeInvitation(
      this,
      inviter,
      invitee,
      new Date(Date.now() - HOUR_MS),
    );
  },
);

Given(
  "{person}'s Invitation to {person} has expired",
  async function (this: ThriveWorld, inviter: string, invitee: string) {
    await storeInvitation(
      this,
      inviter,
      invitee,
      new Date(Date.now() - 8 * DAY_MS),
    );
  },
);

When(
  "{person} resends {person}'s Invitation",
  async function (this: ThriveWorld, name: string, invitee: string) {
    await this.as(
      name,
      'POST',
      `/v1/workspaces/${this.workspaceOf(name)}/invitations/${invitationIdHeldBy(this, invitee)}/resend`,
    );
  },
);

Then(
  "{person} sees {person}'s Invitation was sent by {person}",
  async function (
    this: ThriveWorld,
    owner: string,
    invitee: string,
    inviter: string,
  ) {
    const listed = await listedInvitationTo(this, owner, invitee);
    assert.deepEqual(listed.invitedBy, {
      displayName: inviter,
      email: this.person(inviter).email,
    });
  },
);

Then(
  "{person} sees {person}'s Invitation is good for another 7 days",
  async function (this: ThriveWorld, owner: string, invitee: string) {
    const listed = await listedInvitationTo(this, owner, invitee);
    const left = new Date(listed.expiresAt).getTime() - Date.now();
    assert.equal(listed.status, 'PENDING');
    // A minute's slack for the time the request itself took.
    assert.ok(
      Math.abs(left - 7 * DAY_MS) < 60_000,
      `Expected 7 days left, got ${left / DAY_MS} days.`,
    );
  },
);

Then(
  '{person} is told to wait before sending it again',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('INVITATION_RESENT_TOO_SOON');
  },
);

Then(
  '{person} is told they may not resend Invitations',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('NOT_ALLOWED_TO_RESEND_INVITATIONS');
  },
);

When(
  '{person} opens the link in their Invitation while signed out',
  async function (this: ThriveWorld, invitee: string) {
    await this.anonymously(
      'GET',
      `/v1/invitations/${invitationIdEmailedTo(this, invitee)}`,
    );
  },
);

Then(
  '{person} sees an Invitation from {string} to {string} waiting to be accepted',
  function (
    this: ThriveWorld,
    invitee: string,
    inviterName: string,
    workspaceName: string,
  ) {
    assert.equal(this.lastResponse?.status, 200);
    const { body } = this.lastResponse;
    assert.deepEqual(
      [body.workspaceName, body.inviterName, body.status],
      [workspaceName, inviterName, 'PENDING'],
    );
    // Only enough of the address for its owner to recognise it, never all of it.
    assert.notEqual(body.invitedEmailMasked, this.person(invitee).email);
  },
);

When(
  '{person} invites these people at once:',
  async function (this: ThriveWorld, inviter: string, table: DataTable) {
    await invite(
      this,
      inviter,
      ...table.hashes().map((row) => row.Person as string),
    );
  },
);

const OUTCOMES: Record<string, string> = {
  invited: 'invited',
  'already a Member': 'already_member',
  'already invited': 'already_invited',
  'could not be sent': 'failed',
};

/** The outcome the last send reported for `invitee`'s address. */
function outcomeFor(world: ThriveWorld, invitee: string): string | undefined {
  const { email } = world.person(invitee);
  const results: { email: string; outcome: string }[] =
    world.lastResponse?.body?.results ?? [];
  return results.find((result) => result.email === email)?.outcome;
}

Then(
  '{person} is told how each Invitation went:',
  function (this: ThriveWorld, _inviter: string, table: DataTable) {
    const rows = table.hashes();
    assert.deepEqual(
      rows.map((row) => [row.Person, outcomeFor(this, row.Person as string)]),
      rows.map((row) => [row.Person, OUTCOMES[row.Outcome as string]]),
    );
  },
);

Given(
  'email to {person} cannot be delivered',
  function (this: ThriveWorld, name: string) {
    // Each person's address is unique to this scenario, so it fails nowhere else.
    harness().emailSender.failingFor.add(this.person(name).email);
  },
);

Then(
  '{person} is told the Invitation to {person} could not be sent',
  function (this: ThriveWorld, _inviter: string, invitee: string) {
    assert.equal(outcomeFor(this, invitee), OUTCOMES['could not be sent']);
  },
);

When(
  '{person} looks at the Invitations waiting to be accepted',
  async function (this: ThriveWorld, name: string) {
    await this.as(
      name,
      'GET',
      `/v1/workspaces/${this.workspaceOf(name)}/invitations`,
    );
  },
);

Then(
  '{person} sees no Invitations waiting to be accepted',
  async function (this: ThriveWorld, owner: string) {
    const response = this.succeeded(
      await this.as(
        owner,
        'GET',
        `/v1/workspaces/${this.workspaceOf(owner)}/invitations`,
      ),
      `${owner} listing Invitations`,
    );
    assert.deepEqual(response.body.items, []);
  },
);

Then(
  '{person} is told they may not revoke Invitations',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('NOT_ALLOWED_TO_REVOKE_INVITATIONS');
  },
);

Then(
  '{person} is told they may not see Invitations',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('NOT_ALLOWED_TO_SEE_INVITATIONS');
  },
);

Then(
  '{person} is told the Invitation has expired',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('INVITATION_EXPIRED');
  },
);

Then(
  '{person} is let in without complaint',
  function (this: ThriveWorld, _name: string) {
    // Accepting is safe to repeat (a second click, a reload): the contract answers 204 again.
    assert.equal(this.lastResponse?.status, 204);
  },
);
