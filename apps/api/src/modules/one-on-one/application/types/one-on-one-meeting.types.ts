import type {
  OneOnOneMeetingState,
  OneOnOneTopicSource,
} from '../../domain/entity/one-on-one-meeting.entity';

/** One topic on a meeting's agenda, as read. */
export interface OneOnOneTopicProjection {
  readonly id: string;
  readonly text: string;
  readonly source: OneOnOneTopicSource;
  /** Who added it; `null` for one carried over or from the template. */
  readonly authorAccountId: string | null;
  readonly position: number;
  readonly notes: string;
  readonly notesUpdatedAt: Date | null;
  readonly notesUpdatedByAccountId: string | null;
  readonly discussedAt: Date | null;
}

/** One meeting as stored, read for its two people: its agenda in order. */
export interface OneOnOneMeetingProjection {
  readonly id: string;
  /** The template used for it while it was prepared; `null` when none was. */
  readonly templateKey: string | null;
  readonly occursAt: Date | null;
  readonly startedAt: Date | null;
  readonly startedByAccountId: string | null;
  readonly finishedAt: Date | null;
  readonly finishedByAccountId: string | null;
  /** In agenda order. */
  readonly topics: readonly OneOnOneTopicProjection[];
}

/** One meeting as either of its two people reads it: as stored, with where it stands. */
export interface OneOnOneMeetingView extends OneOnOneMeetingProjection {
  readonly state: OneOnOneMeetingState;
}

/**
 * The next meeting as the panel shows it: the live one, if either has written to it, or what it
 * will open with.
 */
export interface OneOnOneNextMeetingView {
  readonly meeting: OneOnOneMeetingView | null;
  /** When nothing is written yet: what was not reached last time, which it will open with. */
  readonly carried: readonly string[];
  /**
   * Always empty: a meeting no longer opens with a template's questions, which are used while it is
   * prepared. Kept until the web stops reading it (GEN_08 R7).
   */
  readonly templateQuestions: readonly string[];
  /** What the template used for the live meeting is called; `null` when none was used. */
  readonly templateName: string | null;
}

export interface OneOnOneMeetingCursorPageRequest {
  /** The id of the last meeting already sent, or `null` for the first page. */
  readonly afterId: string | null;
  readonly limit: number;
}

export interface OneOnOneMeetingViewPage {
  readonly items: readonly OneOnOneMeetingView[];
  readonly nextAfterId: string | null;
}
