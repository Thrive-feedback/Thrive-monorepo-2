import { describe, expect, it } from 'bun:test';
import {
  FakeAccountBySlugPort,
  FakeActiveWorkspaceGoalPort,
  FakeWorkspaceMembershipPort,
} from '@test/support/feedback.fakes';
import { TagsService } from './tags.service';

const ACME = 'workspace-acme';
const GLOBEX = 'workspace-globex';

function setUp() {
  const activeWorkspaceGoalPort = new FakeActiveWorkspaceGoalPort().with(
    ACME,
    { id: 'goal-ownership', name: 'ownership' },
    { id: 'goal-thai', name: 'ลูกค้ามาก่อน' },
  );
  const accountBySlugPort = new FakeAccountBySlugPort().with(
    { accountId: 'account-cara', slug: 'cara', displayName: 'Cara' },
    { accountId: 'account-dan', slug: 'dan', displayName: 'Dan' },
  );
  const workspaceMembershipPort = new FakeWorkspaceMembershipPort()
    .with(ACME, 'account-cara')
    .with(GLOBEX, 'account-dan');
  return {
    activeWorkspaceGoalPort,
    accountBySlugPort,
    tagsService: new TagsService(
      activeWorkspaceGoalPort,
      accountBySlugPort,
      workspaceMembershipPort,
    ),
  };
}

describe('binding text about to be sent', () => {
  it('binds the active Workspace Goals its hashtags name, in the Admin’s spelling, once each', async () => {
    const { tagsService } = setUp();

    const tags = await tagsService.boundIn(
      ACME,
      'The launch #OWNERSHIP',
      'ดีมาก#ลูกค้ามาก่อน #Ownership #notalist',
    );

    expect(tags.workspaceGoals()).toEqual([
      { workspaceGoalId: 'goal-ownership', name: 'ownership' },
      { workspaceGoalId: 'goal-thai', name: 'ลูกค้ามาก่อน' },
    ]);
  });

  it('binds the Members of the Workspace its slugs name, by the name each goes by', async () => {
    const { tagsService } = setUp();

    const tags = await tagsService.boundIn(ACME, 'You and @cara and @dan');

    expect(tags.mentions()).toEqual([
      { accountId: 'account-cara', slug: 'cara', displayName: 'Cara' },
    ]);
  });

  it('asks nobody anything for text with no hashtag and no slug', async () => {
    const { activeWorkspaceGoalPort, accountBySlugPort, tagsService } = setUp();

    await tagsService.boundIn(ACME, 'Plain words only.');

    expect([activeWorkspaceGoalPort.calls, accountBySlugPort.calls]).toEqual([
      [],
      [],
    ]);
  });
});
