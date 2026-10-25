import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { giveKudos, slugOf } from '../support/journeys';
import type { ThriveWorld } from '../support/world';

interface KudosItem {
  readonly message: string;
  readonly giver: { readonly accountId: string };
  readonly recipients: readonly { readonly accountId: string }[];
}

Given(
  '{person} has given Kudos: {string}',
  async function (this: ThriveWorld, giver: string, message: string) {
    this.succeeded(
      await giveKudos(this, giver, message),
      `${giver} giving Kudos`,
    );
  },
);

When(
  '{person} gives Kudos: {string}',
  async function (this: ThriveWorld, giver: string, message: string) {
    await giveKudos(this, giver, message);
  },
);

When(
  '{person} gives Kudos longer than 280 characters to @{person}',
  async function (this: ThriveWorld, giver: string, recipient: string) {
    await giveKudos(this, giver, `@${recipient} ${'a'.repeat(281)}`);
  },
);

When(
  '{person} looks at the Kudos of their Workspace',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/kudos`,
      ),
      `${name} reading their Workspace's Kudos`,
    );
  },
);

When(
  "{person} signs in and looks at the Kudos of {person}'s Workspace",
  async function (this: ThriveWorld, outsider: string, member: string) {
    if (!this.isSignedIn(outsider)) {
      await this.signIn(outsider);
    }
    await this.as(
      outsider,
      'GET',
      `/v1/workspaces/${this.workspaceOf(member)}/kudos`,
    );
  },
);

Then(
  '{person} reads Kudos {string} from {person} to {person} and {person}',
  async function (
    this: ThriveWorld,
    _name: string,
    written: string,
    giver: string,
    first: string,
    second: string,
  ) {
    const items: KudosItem[] | undefined = this.lastResponse?.body?.items;
    assert.ok(items, 'No Kudos were read.');
    assert.equal(items.length, 1);
    const [kudos] = items as [KudosItem];
    // The feature names people; what was sent, and is read back, carries their slugs.
    let sent = written;
    for (const name of [first, second]) {
      sent = sent.replace(`@${name}`, `@${await slugOf(this, name)}`);
    }
    assert.equal(kudos.message, sent);
    assert.equal(kudos.giver.accountId, this.person(giver).accountId);
    assert.deepEqual(
      kudos.recipients.map((person) => person.accountId).sort(),
      [this.person(first).accountId, this.person(second).accountId].sort(),
    );
  },
);

Then(
  '{person} is told a Kudos has to mention a teammate',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('KUDOS_NEEDS_A_RECIPIENT');
  },
);

Then(
  '{person} is told the Kudos is too long',
  function (this: ThriveWorld, _name: string) {
    this.refusedWith('KUDOS_MESSAGE_TOO_LONG');
  },
);
