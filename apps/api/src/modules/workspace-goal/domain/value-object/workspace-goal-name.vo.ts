import {
  WorkspaceGoalNameEmptyError,
  WorkspaceGoalNameHasSpacesError,
  WorkspaceGoalNameInvalidCharacterError,
  WorkspaceGoalNameTooLongError,
} from '../workspace-goal.errors';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Letters of any script with their marks — Thai vowels and tone marks are marks — digits, `-`, `_`. */
const NAME_CHARACTERS = /^[\p{L}\p{M}\p{N}_-]+$/u;

/**
 * What a Workspace Goal is written as, after its `#` — `ownership`. A leading `#` someone typed
 * is dropped, since the hashtag is not part of the name. The limit counts what a reader sees as
 * one character, so Thai marks do not use it up.
 *
 * The spelling is kept as the Admin wrote it, and that is how it is shown. Two names that differ
 * only in letter case are the same Workspace Goal (`ADR-0036`), which `key` expresses.
 */
export class WorkspaceGoalName {
  static readonly MAX_LENGTH = 30;

  private constructor(private readonly value: string) {}

  static of(raw: string): WorkspaceGoalName {
    const normalized = raw.trim().replace(/^#/u, '').normalize('NFC');
    const length = [...graphemes.segment(normalized)].length;
    if (length === 0) {
      throw new WorkspaceGoalNameEmptyError();
    }
    if (/\s/u.test(normalized)) {
      throw new WorkspaceGoalNameHasSpacesError();
    }
    if (!NAME_CHARACTERS.test(normalized)) {
      throw new WorkspaceGoalNameInvalidCharacterError();
    }
    if (length > WorkspaceGoalName.MAX_LENGTH) {
      throw new WorkspaceGoalNameTooLongError(WorkspaceGoalName.MAX_LENGTH);
    }
    return new WorkspaceGoalName(normalized);
  }

  /** The same for every spelling that differs only in letter case — what makes a name taken. */
  key(): string {
    return this.value.toLowerCase();
  }

  toString(): string {
    return this.value;
  }
}
