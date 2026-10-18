import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { WorkspaceFixtures } from '@test/support/workspace.integration-fixtures';
import { BetterAuthSessionWorkspaceAdapter } from './better-auth-session-workspace.adapter';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const sessionWorkspace = new BetterAuthSessionWorkspaceAdapter(auth);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

describe("keeping a session's Workspace through the organization plugin", () => {
  it('answers none for a session that has not chosen one', async () => {
    const ann = await fixtures.aSignedInAccount('session-none');

    expect(await sessionWorkspace.selectedIn(ann.credential)).toBeNull();
  });

  it('answers the Workspace a session was put in', async () => {
    const ann = await fixtures.aSignedInAccount('session-select');
    // Founding puts the session in Acme, so this moves it away from one.
    await fixtures.aWorkspace(ann);
    const other = await fixtures.aSignedInAccount('session-other');
    const otherWorkspaceId = await fixtures.aWorkspace(other);
    await fixtures.addMember(otherWorkspaceId, ann, 'member');

    await sessionWorkspace.select(ann.credential, otherWorkspaceId);

    expect(await sessionWorkspace.selectedIn(ann.credential)).toBe(
      otherWorkspaceId,
    );
  });

  it('leaves another session of the same Account where it was', async () => {
    const ann = await fixtures.aSignedInAccount('session-devices');
    const workspaceId = await fixtures.aWorkspace(ann);
    const phone = await fixtures.anotherSessionOf(ann);

    await sessionWorkspace.select(ann.credential, workspaceId);

    expect(await sessionWorkspace.selectedIn(phone.credential)).toBeNull();
  });
});
