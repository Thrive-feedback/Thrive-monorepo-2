import { describe, expect, it } from 'bun:test';
import { WorkspaceGoalDescriptionTooLongError } from '../workspace-goal.errors';
import { WorkspaceGoalDescription } from './workspace-goal-description.vo';

describe("a Workspace Goal's description", () => {
  it('keeps what the Admin wrote, with surrounding and repeated spaces collapsed', () => {
    expect(
      WorkspaceGoalDescription.of('  We finish   what we start. ')?.toString(),
    ).toBe('We finish what we start.');
  });

  it('is no description at all when only spaces were written', () => {
    expect(WorkspaceGoalDescription.of('   ')).toBeNull();
  });

  it('is refused past one sentence of 200 characters', () => {
    expect(() =>
      WorkspaceGoalDescription.of(
        'a'.repeat(WorkspaceGoalDescription.MAX_LENGTH + 1),
      ),
    ).toThrow(WorkspaceGoalDescriptionTooLongError);
  });
});
