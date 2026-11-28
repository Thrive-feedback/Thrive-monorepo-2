import {
  OneOnOneMeetingAlreadyStartedError,
  OneOnOneMeetingFinishedError,
  OneOnOneMeetingNotStartedError,
  OneOnOneMeetingTextInvalidError,
  OneOnOneTemplateInUseError,
  OneOnOneTopicAlreadyOnAgendaError,
  OneOnOneTopicChangedError,
  OneOnOneTopicNotFoundError,
  OneOnOneTopicNotYoursError,
  OneOnOneTopicOrderInvalidError,
} from '../one-on-one-meeting.errors';
import {
  templateKeyOf,
  templateRefOf,
} from '../value-object/one-on-one-template-ref.vo';

/** How long a topic may be: a line on an agenda. */
export const MAX_TOPIC_LENGTH = 200;
/** How long the shared note on a topic may be. */
export const MAX_MEETING_NOTE_LENGTH = 4000;

/** Where a topic came from: what was not reached last time, the template, or a person. */
export type OneOnOneTopicSource = 'CARRIED' | 'TEMPLATE' | 'PERSON';

export type OneOnOneMeetingState = 'PREPARING' | 'IN_PROGRESS' | 'FINISHED';

/**
 * The item of the other person's Profile a person brought onto the agenda as a topic, named by id:
 * a piece of Feedback, a Kudos, or an Ask still open between the two (brain ADR-0063).
 */
export interface OneOnOneTopicBroughtFrom {
  readonly kind: 'FEEDBACK' | 'KUDOS' | 'ASK';
  readonly id: string;
}

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
  /** When it was put on the agenda: which meeting day it was written for. */
  readonly addedAt: Date;
  /**
   * The meeting day it was written for, kept when that day was skipped and the schedule then
   * changed, `YYYY-MM-DD`; `null` otherwise, when it is worked out from the schedule if at all.
   */
  readonly carriedFrom: string | null;
  /** What it was brought from, for one a person added from what they read before the meeting. */
  readonly broughtFrom: OneOnOneTopicBroughtFrom | null;
  /** The template that asked it, by its key as the wire carries it; `null` unless from a template. */
  readonly templateKey: string | null;
}

export interface OneOnOneMeetingSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly oneOnOneId: string;
  /** The template used last for it while it was prepared; `null` when none was. */
  readonly templateKey: string | null;
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
 * One meeting of a 1:1 (brain ADR-0060 §5, §6 and §10; ADR-0061, proposed): its agenda, the notes
 * both write on each topic, and when it was started and finished. Both people are equal in it.
 *
 * It is **preparing** from the moment either writes to the next meeting's agenda, until either
 * presses Start, which may be any time; it is then **in progress** until either finishes it, which
 * shares its summary with both and closes it for good. A 1:1 has one meeting that is not finished
 * at a time, and an open one stays open until somebody finishes it.
 *
 * Before Start the agenda is prepared: topics are added, removed and reordered, and either person
 * may use templates for it, each adding its questions after the rest (ADR 0099). Notes on topics and
 * the "discussed" tick come with Start. Anyone reorders; a topic a person wrote is theirs to remove,
 * and what came from the template or from last time anyone may remove.
 */
export class OneOnOneMeeting {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly oneOnOneId: string,
    private templateKey: string | null,
    private occursAt: Date | null,
    private startedAt: Date | null,
    private startedByAccountId: string | null,
    private finishedAt: Date | null,
    private finishedByAccountId: string | null,
    private topics: OneOnOneTopicSnapshot[],
  ) {}

  /**
   * The next meeting's agenda, opened by the first write to it with what was not reached last time,
   * and no template until somebody uses one.
   */
  static open(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly oneOnOneId: string;
    readonly carried: readonly string[];
    readonly newTopicId: () => string;
    /** Now: when its first topics are put on it. */
    readonly at: Date;
  }): OneOnOneMeeting {
    const topics: OneOnOneTopicSnapshot[] = details.carried.map(
      (text, position) => ({
        id: details.newTopicId(),
        text: topicText(text),
        source: 'CARRIED',
        authorAccountId: null,
        position,
        notes: '',
        notesUpdatedAt: null,
        notesUpdatedByAccountId: null,
        discussedAt: null,
        addedAt: details.at,
        carriedFrom: null,
        broughtFrom: null,
        templateKey: null,
      }),
    );
    return new OneOnOneMeeting(
      details.id,
      details.workspaceId,
      details.oneOnOneId,
      null,
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

  /**
   * Either person adds a topic, at the end of the agenda, before or during the meeting. One brought
   * from Feedback or a Kudos names it, and the same one is brought once.
   */
  addTopic(
    topicId: string,
    byAccountId: string,
    text: string,
    at: Date,
    broughtFrom: OneOnOneTopicBroughtFrom | null = null,
  ): void {
    this.assertNotFinished();
    if (
      broughtFrom &&
      this.topics.some(
        (topic) =>
          topic.broughtFrom?.kind === broughtFrom.kind &&
          topic.broughtFrom.id === broughtFrom.id,
      )
    ) {
      throw new OneOnOneTopicAlreadyOnAgendaError();
    }
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
        addedAt: at,
        carriedFrom: null,
        broughtFrom,
        templateKey: null,
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

  /** The templates whose questions are on the agenda, each once, in agenda order. */
  templatesInUse(): readonly string[] {
    return [
      ...new Set(
        this.topics.flatMap((topic) =>
          topic.templateKey === null ? [] : [topic.templateKey],
        ),
      ),
    ];
  }

  /**
   * Either person uses a template for the agenda while it is prepared (ADR 0099). Its questions are
   * added after everything else, each naming it; one already on the agenda is not asked twice, and
   * nothing already there goes. A template is used once while any question it asked is still on the
   * agenda; once all are removed, it may be used again.
   */
  useTemplate(details: {
    readonly templateKey: string;
    readonly questions: readonly string[];
    readonly newTopicId: () => string;
    readonly at: Date;
  }): void {
    this.assertNotFinished();
    if (this.state() === 'IN_PROGRESS') {
      throw new OneOnOneMeetingAlreadyStartedError();
    }
    // As it is stored, so the same template sent with its id in capitals is still the same one.
    const templateKey = templateKeyOf(templateRefOf(details.templateKey));
    if (this.templatesInUse().includes(templateKey)) {
      throw new OneOnOneTemplateInUseError();
    }
    const kept = this.topics;
    const asked = new Set(kept.map((topic) => topic.text));
    const added: OneOnOneTopicSnapshot[] = [];
    for (const question of details.questions) {
      const text = topicText(question);
      if (!asked.has(text)) {
        asked.add(text);
        added.push({
          id: details.newTopicId(),
          text,
          source: 'TEMPLATE',
          authorAccountId: null,
          position: 0,
          notes: '',
          notesUpdatedAt: null,
          notesUpdatedByAccountId: null,
          discussedAt: null,
          addedAt: details.at,
          carriedFrom: null,
          broughtFrom: null,
          templateKey,
        });
      }
    }
    this.topics = [...kept, ...added].map((topic, position) => ({
      ...topic,
      position,
    }));
    this.templateKey = templateKey;
  }

  /**
   * Either person takes a template off the agenda while it is prepared: every question it asked goes
   * at once, since what a template asked is anyone's to remove, and the rest close up in order
   * (ADR 0099).
   * One not on the agenda leaves it as it is. The template used last is then the last one still on
   * it, or none.
   */
  removeTemplate(rawTemplateKey: string): void {
    this.assertNotFinished();
    if (this.state() === 'IN_PROGRESS') {
      throw new OneOnOneMeetingAlreadyStartedError();
    }
    const templateKey = templateKeyOf(templateRefOf(rawTemplateKey));
    this.topics = this.topics
      .filter((topic) => topic.templateKey !== templateKey)
      .map((topic, position) => ({ ...topic, position }));
    this.templateKey = this.templatesInUse().at(-1) ?? null;
  }

  /**
   * Before the schedule changes, keeps on each topic the skipped meeting day it was written for, as
   * the old schedule works it out: the new one cannot. Only an agenda still being prepared moves on.
   */
  keepCarriedFrom(
    carriedFrom: (topic: OneOnOneTopicSnapshot) => string | null,
  ): void {
    if (this.state() !== 'PREPARING') {
      return;
    }
    this.topics = this.topics.map((topic) =>
      topic.carriedFrom === null
        ? { ...topic, carriedFrom: carriedFrom(topic) }
        : topic,
    );
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
