import {
  WorkspaceNameEmptyError,
  WorkspaceNameTooLongError,
} from '../workspace.errors';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * What the founder calls their company's space. Surrounding and repeated whitespace is
 * collapsed, and the limit counts what a reader sees as one character, so Thai marks do
 * not use it up. Not unique: two companies may share a name.
 */
export class WorkspaceName {
  static readonly MAX_LENGTH = 100;

  private constructor(private readonly value: string) {}

  static of(raw: string): WorkspaceName {
    const normalized = raw.trim().replace(/\s+/gu, ' ');
    const length = [...graphemes.segment(normalized)].length;
    if (length === 0) {
      throw new WorkspaceNameEmptyError();
    }
    if (length > WorkspaceName.MAX_LENGTH) {
      throw new WorkspaceNameTooLongError(WorkspaceName.MAX_LENGTH);
    }
    return new WorkspaceName(normalized);
  }

  equals(other: WorkspaceName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
