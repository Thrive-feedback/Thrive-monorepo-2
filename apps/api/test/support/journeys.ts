import assert from 'node:assert/strict';
import { harness } from './harness';
import type { ApiResponse, ThriveWorld } from './world';

/**
 * The calls a person makes through the product, shared by the steps that perform them and
 * the steps that set them up as a given (`BE_13` R3, R4).
 */

export function introduce(
  world: ThriveWorld,
  name: string,
): Promise<ApiResponse> {
  return world.as(name, 'POST', '/v1/profiles', {
    fullName: `${name} Lee`,
    displayName: name,
  });
}

export async function createWorkspace(
  world: ThriveWorld,
  name: string,
  workspaceName: string,
): Promise<ApiResponse> {
  const response = await world.as(name, 'POST', '/v1/workspaces', {
    name: workspaceName,
  });
  if (response.status === 201) {
    world.joined(name, response.body.id);
  }
  return response;
}

/** Signs `name` in if they are not yet, introduces them, and founds `workspaceName`. */
export async function ownAWorkspace(
  world: ThriveWorld,
  name: string,
  workspaceName: string,
): Promise<void> {
  if (!world.isSignedIn(name)) {
    await world.signIn(name);
  }
  world.succeeded(
    await introduce(world, name),
    `${name} introducing themselves`,
  );
  world.succeeded(
    await createWorkspace(world, name, workspaceName),
    `${name} creating ${workspaceName}`,
  );
}

export function invite(
  world: ThriveWorld,
  inviter: string,
  invitee: string,
): Promise<ApiResponse> {
  return world.as(
    inviter,
    'POST',
    `/v1/workspaces/${world.workspaceOf(inviter)}/invitations`,
    { emails: [world.person(invitee).email] },
  );
}

/** The Invitation id, read from the link in the email `invitee` was sent — as they would. */
export function invitationIdEmailedTo(
  world: ThriveWorld,
  invitee: string,
): string {
  const { email } = world.person(invitee);
  const sent = harness()
    .emailSender.sent.filter((message) => message.to === email)
    .at(-1);
  assert.ok(sent, `No Invitation was emailed to ${invitee}.`);
  const link = sent.text.match(/\/invitations\/([0-9a-f-]{36})/);
  assert.ok(
    link,
    `The email to ${invitee} has no Invitation link:\n${sent.text}`,
  );
  return link[1] as string;
}

export function accept(
  world: ThriveWorld,
  name: string,
  invitationId: string,
): Promise<ApiResponse> {
  return world.as(name, 'POST', `/v1/invitations/${invitationId}/accept`);
}

/** Signs `name` in, has `owner` invite them, and accepts from the email. */
export async function joinWorkspaceOf(
  world: ThriveWorld,
  name: string,
  owner: string,
): Promise<void> {
  if (!world.isSignedIn(name)) {
    await world.signIn(name);
  }
  world.succeeded(
    await invite(world, owner, name),
    `${owner} inviting ${name}`,
  );
  world.succeeded(
    await accept(world, name, invitationIdEmailedTo(world, name)),
    `${name} accepting the Invitation`,
  );
  world.joined(name, world.workspaceOf(owner));
}

export async function askForFeedback(
  world: ThriveWorld,
  requester: string,
  giver: string,
  topic: string,
): Promise<ApiResponse> {
  const workspaceId = world.workspaceOf(requester);
  const response = await world.as(
    requester,
    'POST',
    `/v1/workspaces/${workspaceId}/feedback-requests`,
    { topic, giverAccountIds: [world.person(giver).accountId] },
  );
  if (response.status === 201) {
    world.feedbackRequest = { id: response.body.id, workspaceId };
  }
  return response;
}

export async function myMemberships(
  world: ThriveWorld,
  name: string,
): Promise<{ workspace: { name: string }; role: string }[]> {
  const response = world.succeeded(
    await world.as(name, 'GET', '/v1/members/mine'),
    `Listing ${name}'s memberships`,
  );
  return response.body.items;
}
