import { describe, expect, it } from 'bun:test';
import {
  WorkspaceNameEmptyError,
  WorkspaceNameTooLongError,
} from '../workspace.errors';
import { WorkspaceName } from './workspace-name.vo';

describe('a Workspace name', () => {
  it('drops surrounding spaces and collapses repeated ones', () => {
    expect(WorkspaceName.of('  Acme   Corp ').toString()).toBe('Acme Corp');
  });

  it('is refused when it is only spaces', () => {
    expect(() => WorkspaceName.of('   ')).toThrow(WorkspaceNameEmptyError);
  });

  it('is accepted at exactly 100 characters', () => {
    expect(WorkspaceName.of('a'.repeat(100)).toString()).toHaveLength(100);
  });

  it('is refused past 100 characters', () => {
    expect(() => WorkspaceName.of('a'.repeat(101))).toThrow(
      WorkspaceNameTooLongError,
    );
  });

  it('counts a Thai syllable with its vowel and tone marks as what a reader sees', () => {
    // "กิ่" is one consonant with two marks: three code units, one character on screen.
    expect(WorkspaceName.of('กิ่'.repeat(100)).toString()).toHaveLength(300);
  });

  it('equals another with the same name once tidied', () => {
    expect(
      WorkspaceName.of(' Acme  Corp').equals(WorkspaceName.of('Acme Corp')),
    ).toBe(true);
  });
});
