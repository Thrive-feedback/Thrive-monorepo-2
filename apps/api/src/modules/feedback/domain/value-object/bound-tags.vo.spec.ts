import { describe, expect, it } from 'bun:test';
import { BoundTags } from './bound-tags.vo';

describe('the Workspace Goals and Members sent text is bound to', () => {
  it('holds each Workspace Goal and each Member once, however often they were named', () => {
    const tags = BoundTags.of({
      workspaceGoals: [
        { workspaceGoalId: 'goal-1', name: 'ownership' },
        { workspaceGoalId: 'goal-1', name: 'ownership' },
      ],
      mentions: [
        { accountId: 'account-cara', slug: 'cara', displayName: 'Cara' },
        { accountId: 'account-cara', slug: 'cara', displayName: 'Cara' },
      ],
    });

    expect([tags.workspaceGoals(), tags.mentions()]).toEqual([
      [{ workspaceGoalId: 'goal-1', name: 'ownership' }],
      [{ accountId: 'account-cara', slug: 'cara', displayName: 'Cara' }],
    ]);
  });

  it('is bound to nothing when nothing was named', () => {
    const tags = BoundTags.none();

    expect([tags.workspaceGoals(), tags.mentions()]).toEqual([[], []]);
  });
});
