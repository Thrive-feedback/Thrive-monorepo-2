import {
  OneOnOneMeetingAlreadyStartedError,
  OneOnOneMeetingFinishedError,
  OneOnOneMeetingNotStartedError,
  OneOnOneMeetingTextInvalidError,
  OneOnOneTopicChangedError,
  OneOnOneTopicNotFoundError,
  OneOnOneTopicNotYoursError,
  OneOnOneTopicOrderInvalidError,
} from '../one-on-one-meeting.errors';

/** How long a topic may be: a line on an agenda. */
export const MAX_TOPIC_LENGTH = 200;
/** How long the shared note on a topic may be. */
export const MAX_MEETING_NOTE_LENGTH = 4000;

/** Where a topic came from: what was not reached last time, the template, or a person. */
export type OneOnOneTopicSource = 'CARRIED' | 'TEMPLATE' | 'PERSON';

export type OneOnOneMeetingState = 'PREPARING' | 'IN_PROGRESS' | 'FINISHED';

export interface OneOnOneTopicSnapshot {
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

export interface OneOnOneMeetingSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly oneOnOneId: string;
  readonly templateKey: string;
  readonly occursAt: Date | null;
  readonly startedAt: Date | null;
  readonly startedByAccountId: string | null;
  readonly finishedAt: Date | null;
  readonly finishedByAccountId: string | null;
  readonly topics: readonly OneOnOneTopicSnapshot[];
}

/** A line of text as written, trimmed, refused when blank or too long. */
function topicText(raw: string): string {
  const text = raw.trim();
  if (text === '') {
    throw new OneOnOneMeetingTextInvalidError('A topic says something.');
  }
  if (text.length > MAX_TOPIC_LENGTH) {
    throw new OneOnOneMeetingTextInvalidError(
      `A topic is at most ${MAX_TOPIC_LENGTH} characters.`,
    );
  }
  return text;
}

/** A note as written, with its ends trimmed; blank is allowed, and means no note. */
export function meetingNote(raw: string): string {
  const note = raw.trim();
  if (note.length > MAX_MEETING_NOTE_LENGTH) {
    throw new OneOnOneMeetingTextInvalidError(
      `A note is at most ${MAX_MEETING_NOTE_LENGTH} characters.`,
    );
  }
  return note;
}

/** A meeting's state, from when it was started and finished. */
export function meetingStateOf(times: {
  readonly startedAt: Date | null;
  readonly finishedAt: Date | null;
}): OneOnOneMeetingState {
  if (times.finishedAt !== null) {
    return 'FINISHED';
  }
  return times.startedAt === null ? 'PREPARING' : 'IN_PROGRESS';
}

/** What a meeting leaves for the next: its topics not talked about, in agenda order. */
export function undiscussedOf(
  topics: readonly Pick<
    OneOnOneTopicSnapshot,
    'text' | 'position' | 'discussedAt'
  >[],
): readonly string[] {
  return [...topics]
    .sort((a, b) => a.position - b.position)
    .filter((topic) => topic.discussedAt === null)
    .map((topic) => topic.text);
}

/**
 * The agenda a next meeting opens with: what was not reached last time first, then the template's
 * questions not already among them, so a question carried over is not asked twice.
 */
export function openingAgenda(
  carried: readonly string[],
  templateQuestions: readonly string[],
): readonly { readonly text: string; readonly source: OneOnOneTopicSource }[] {
  const carriedTexts = new Set(carried.map((text) => text.trim()));
  return [
    ...carried.map((text) => ({ text, source: 'CARRIED' as const })),
    ...templateQuestions
      .filter((text) => !carriedTexts.has(text.trim()))
      .map((text) => ({ text, source: 'TEMPLATE' as const })),
  ];
}

/**
 * One meeting of a 1:1 (brain ADR-0060 §5, §6 and §10; ADR-0061, proposed): its agenda, the notes
 * both write on each topic, and when it was started and finished. Both people are equal in it.
 *
 * It is **preparing** from the moment either writes to the next meeting's agenda, until either
 * presses Start, which may be any time; it is then **in progress** until either finishes it, which
 * shares its summary with both and closes it for good. A 1:1 has one meeting that is not finished
 * at a time, and an open one stays open until somebody finishes it.
 *
 * Before Start the agenda is prepared: topics are added, removed and reordered. Notes on topics and
 * the "discussed" tick come with Start. Anyone reorders; a topic a person wrote is theirs to remove,
 * and what came from the template or from last time anyone may remove.
 */
export class OneOnOneMeeting {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly oneOnOneId: string,
    private readonly templateKey: string,
    private occursAt: Date | null,
    private startedAt: Date | null,
    private startedByAccountId: string | null,
    private finishedAt: Date | null,
    private finishedByAccountId: string | null,
    private topics: OneOnOneTopicSnapshot[],
  ) {}

  /**
   * The next meeting's agenda, opened by the first write to it: what was not reached last time
   * first, then the template's questions not already among them.
   */
  static open(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly oneOnOneId: string;
    readonly templateKey: string;
    readonly carried: readonly string[];
    readonly templateQuestions: readonly string[];
    readonly newTopicId: () => string;
  }): OneOnOneMeeting {
    const topics: OneOnOneTopicSnapshot[] = openingAgenda(
      details.carried,
      details.templateQuestions,
    ).map(({ text, source }, position) => ({
      id: details.newTopicId(),
      text: topicText(text),
      source,
      authorAccountId: null,
      position,
      notes: '',
      notesUpdatedAt: null,
      notesUpdatedByAccountId: null,
      discussedAt: null,
    }));
    return new OneOnOneMeeting(
      details.id,
      details.workspaceId,
      details.oneOnOneId,
      details.templateKey,
      null,
      null,
      null,
      null,
      null,
      topics,
    );
  }

  /** Rebuilds one already stored; only the repository calls this. */
  static restore(snapshot: OneOnOneMeetingSnapshot): OneOnOneMeeting {
    return new OneOnOneMeeting(
      snapshot.id,
      snapshot.workspaceId,
      snapshot.oneOnOneId,
      snapshot.templateKey,
      snapshot.occursAt,
      snapshot.startedAt,
      snapshot.startedByAccountId,
      snapshot.finishedAt,
      snapshot.finishedByAccountId,
      [...snapshot.topics].sort((a, b) => a.position - b.position),
    );
  }

  state(): OneOnOneMeetingState {
    return meetingStateOf({
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    });
  }

  private assertNotFinished(): void {
    if (this.state() === 'FINISHED') {
      throw new OneOnOneMeetingFinishedError();
    }
  }

  private assertInProgress(): void {
    this.assertNotFinished();
    if (this.state() !== 'IN_PROGRESS') {
      throw new OneOnOneMeetingNotStartedError();
    }
  }

  private topic(topicId: string): OneOnOneTopicSnapshot {
    const found = this.topics.find((topic) => topic.id === topicId);
    if (!found) {
      throw new OneOnOneTopicNotFoundError();
    }
    return found;
  }

  private replace(topicId: string, patch: Partial<OneOnOneTopicSnapshot>) {
    this.topics = this.topics.map((topic) =>
      topic.id === topicId ? { ...topic, ...patch } : topic,
    );
  }

  /** Either person adds a topic, at the end of the agenda, before or during the meeting. */
  addTopic(topicId: string, byAccountId: string, text: string): void {
    this.assertNotFinished();
    this.topics = [
      ...this.topics,
      {
        id: topicId,
        text: topicText(text),
        source: 'PERSON',
        authorAccountId: byAccountId,
        position: this.topics.length,
        notes: '',
        notesUpdatedAt: null,
        notesUpdatedByAccountId: null,
        discussedAt: null,
      },
    ];
  }

  /** The person who wrote a topic rewords it; one from the template or last time, anyone may. */
  rewordTopic(topicId: string, byAccountId: string, text: string): void {
    this.assertNotFinished();
    this.assertMayChange(this.topic(topicId), byAccountId);
    this.replace(topicId, { text: topicText(text) });
  }

  /** What a person wrote is theirs to remove; what came from the template or last time, anyone's. */
  removeTopic(topicId: string, byAccountId: string): void {
    this.assertNotFinished();
    this.assertMayChange(this.topic(topicId), byAccountId);
    this.topics = this.topics
      .filter((topic) => topic.id !== topicId)
      .map((topic, position) => ({ ...topic, position }));
  }

  private assertMayChange(topic: OneOnOneTopicSnapshot, byAccountId: string) {
    if (topic.source === 'PERSON' && topic.authorAccountId !== byAccountId) {
      throw new OneOnOneTopicNotYoursError();
    }
  }

  /** Either person puts the agenda in a new order, naming every topic once. */
  reorder(topicIds: readonly string[]): void {
    this.assertNotFinished();
    const known = new Set(this.topics.map((topic) => topic.id));
    if (
      topicIds.length !== known.size ||
      new Set(topicIds).size !== topicIds.length ||
      topicIds.some((id) => !known.has(id))
    ) {
      throw new OneOnOneTopicOrderInvalidError();
    }
    this.topics = topicIds.map((id, position) => ({
      ...this.topic(id),
      position,
    }));
  }

  /**
   * Either person writes the shared note on a topic while the meeting runs. `readAt` is when the
   * writer last read it: if the other person changed it since, the write is refused rather than
   * overwriting what they wrote, so the writer syncs first.
   */
  writeTopicNote(
    topicId: string,
    byAccountId: string,
    notes: string,
    readAt: Date | null,
    at: Date,
  ): void {
    this.assertInProgress();
    const topic = this.topic(topicId);
    if (
      topic.notesUpdatedAt !== null &&
      topic.notesUpdatedByAccountId !== byAccountId &&
      (readAt === null || topic.notesUpdatedAt.getTime() > readAt.getTime())
    ) {
      throw new OneOnOneTopicChangedError();
    }
    this.replace(topicId, {
      notes: meetingNote(notes),
      notesUpdatedAt: at,
      notesUpdatedByAccountId: byAccountId,
    });
  }

  /** Either person ticks a topic as talked about, or unticks it, while the meeting runs. */
  markDiscussed(topicId: string, discussed: boolean, at: Date): void {
    this.assertInProgress();
    this.topic(topicId);
    this.replace(topicId, { discussedAt: discussed ? at : null });
  }

  /**
   * Either person starts the meeting, whenever the two actually meet. It stands for the occurrence
   * `occursAt` names: the one about to happen or happening, or now if the schedule has none.
   */
  start(byAccountId: string, at: Date, occursAt: Date | null): void {
    this.assertNotFinished();
    if (this.state() === 'IN_PROGRESS') {
      throw new OneOnOneMeetingAlreadyStartedError();
    }
    this.startedAt = at;
    this.startedByAccountId = byAccountId;
    this.occursAt = occursAt ?? at;
  }

  /** Either person finishes it, sharing its summary with both; nothing more is written to it. */
  finish(byAccountId: string, at: Date): void {
    this.assertInProgress();
    this.finishedAt = at;
    this.finishedByAccountId = byAccountId;
  }

  /** What was not talked about, which the next meeting opens with. */
  undiscussed(): readonly string[] {
    return undiscussedOf(this.topics);
  }

  snapshot(): OneOnOneMeetingSnapshot {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      oneOnOneId: this.oneOnOneId,
      templateKey: this.templateKey,
      occursAt: this.occursAt,
      startedAt: this.startedAt,
      startedByAccountId: this.startedByAccountId,
      finishedAt: this.finishedAt,
      finishedByAccountId: this.finishedByAccountId,
      topics: this.topics,
    };
  }
}
