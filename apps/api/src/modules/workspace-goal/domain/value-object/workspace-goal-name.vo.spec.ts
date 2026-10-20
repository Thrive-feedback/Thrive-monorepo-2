import { describe, expect, it } from 'bun:test';
import {
  WorkspaceGoalNameEmptyError,
  WorkspaceGoalNameHasSpacesError,
  WorkspaceGoalNameInvalidCharacterError,
  WorkspaceGoalNameTooLongError,
} from '../workspace-goal.errors';
import { WorkspaceGoalName } from './workspace-goal-name.vo';

describe("a Workspace Goal's name", () => {
  it('keeps the spelling the Admin wrote, without surrounding spaces or a leading #', () => {
    expect(WorkspaceGoalName.of('  #Customer-First ').toString()).toBe(
      'Customer-First',
    );
  });

  it('is the same name in any letter case', () => {
    expect(WorkspaceGoalName.of('Ownership').key()).toBe(
      WorkspaceGoalName.of('OWNERSHIP').key(),
    );
  });

  it('may be written in Thai, marks and all', () => {
    expect(WorkspaceGoalName.of('ความเป็นเจ้าของ').toString()).toBe(
      'ความเป็นเจ้าของ',
    );
  });

  it('may hold digits and underscores', () => {
    expect(WorkspaceGoalName.of('ship_2026').toString()).toBe('ship_2026');
  });

  it('is refused when nothing is left once the # and spaces are gone', () => {
    expect(() => WorkspaceGoalName.of(' # ')).toThrow(
      WorkspaceGoalNameEmptyError,
    );
  });

  it('is refused with a space in it, because a hashtag ends at the first space', () => {
    expect(() => WorkspaceGoalName.of('ship it')).toThrow(
      WorkspaceGoalNameHasSpacesError,
    );
  });

  it.each(['own.ership', 'own,ership', '#own#ership', 'own!'])(
    'is refused with punctuation that would blur where a hashtag ends: %s',
    (raw) => {
      expect(() => WorkspaceGoalName.of(raw)).toThrow(
        WorkspaceGoalNameInvalidCharacterError,
      );
    },
  );

  it('is refused past 30 characters', () => {
    expect(() =>
      WorkspaceGoalName.of('a'.repeat(WorkspaceGoalName.MAX_LENGTH + 1)),
    ).toThrow(WorkspaceGoalNameTooLongError);
  });

  it('counts a Thai cluster as the one character a reader sees', () => {
    expect(() =>
      WorkspaceGoalName.of('ที่'.repeat(WorkspaceGoalName.MAX_LENGTH)),
    ).not.toThrow();
  });

  it('gives the key a hashtag written in any letter case stands for', () => {
    expect(WorkspaceGoalName.keyOf('OwnerShip')).toBe('ownership');
  });

  it('gives no key for a hashtag no Workspace Goal could be named', () => {
    expect(WorkspaceGoalName.keyOf('a'.repeat(31))).toBeNull();
  });
});
