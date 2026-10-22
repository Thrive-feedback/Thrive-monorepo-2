import { WorkspaceGoalDescriptionTooLongError } from '../workspace-goal.errors';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * The one sentence that says what a Workspace Goal means, read by every Member in Settings.
 * Optional: blank is no description at all. Surrounding and repeated whitespace is collapsed.
 *
 * `ADR-0036` asks for one sentence without naming a length; 200 is this release's reading of
 * it, matching a Request message, and the column is `text`, so raising it costs no migration.
 */
export class WorkspaceGoalDescription {
  static readonly MAX_LENGTH = 200;

  private constructor(private readonly value: string) {}

  /** `null` when nothing but whitespace was written. */
  static of(raw: string): WorkspaceGoalDescription | null {
    const normalized = raw.trim().replace(/\s+/gu, ' ');
    const length = [...graphemes.segment(normalized)].length;
    if (length === 0) {
      return null;
    }
    if (length > WorkspaceGoalDescription.MAX_LENGTH) {
      throw new WorkspaceGoalDescriptionTooLongError(
        WorkspaceGoalDescription.MAX_LENGTH,
      );
    }
    return new WorkspaceGoalDescription(normalized);
  }

  toString(): string {
    return this.value;
  }
}
