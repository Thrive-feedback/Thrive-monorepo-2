import { describe, expect, it } from 'bun:test';
import {
  OneOnOneMeetingAlreadyStartedError,
  OneOnOneMeetingFinishedError,
  OneOnOneMeetingNotStartedError,
  OneOnOneMeetingTextInvalidError,
  OneOnOneTemplateInUseError,
  OneOnOneTopicChangedError,
  OneOnOneTopicNotFoundError,
  OneOnOneTopicNotYoursError,
  OneOnOneTopicOrderInvalidError,
} from '../one-on-one-meeting.errors';
import { OneOnOneMeeting, undiscussedOf } from './one-on-one-meeting.entity';

/** When the topics in these specs were put on the agenda. */
const ADDED_AT = new Date('2026-11-26T03:00:00.000Z');

const KRIT = 'account-krit';
const MINT = 'account-mint';
const NOW = new Date('2026-11-26T03:00:00.000Z');
const LATER = new Date('2026-11-26T03:10:00.000Z');

/** Opened with one topic carried over, then the Weekly check-in used for it. */
function opened() {
  let next = 0;
  const newTopicId = () => {
    next += 1;
    return `topic-${next}`;
  };
  const meeting = OneOnOneMeeting.open({
    id: 'meeting-1',
    workspaceId: 'workspace-acme',
    oneOnOneId: 'one-on-one-1',
    carried: ['Launch retro'],
    newTopicId,
    at: ADDED_AT,
  });
  meeting.useTemplate({
    templateKey: 'weekly-check-in',
    questions: ['What went well this week?'],
    newTopicId,
    at: ADDED_AT,
  });
  return meeting;
}

function started() {
  const meeting = opened();
  meeting.start(KRIT, NOW, NOW);
  return meeting;
}

describe('a meeting being prepared', () => {
  it('opens with what was not reached last time, and no template', () => {
    const meeting = OneOnOneMeeting.open({
      id: 'meeting-2',
      workspaceId: 'workspace-acme',
      oneOnOneId: 'one-on-one-1',
      carried: ['Launch retro'],
      newTopicId: () => 'topic-1',
      at: ADDED_AT,
    });

    expect(meeting.state()).toBe('PREPARING');
    expect(meeting.snapshot().templateKey).toBeNull();
    expect(
      meeting.snapshot().topics.map((topic) => [topic.text, topic.source]),
    ).toEqual([['Launch retro', 'CARRIED']]);
  });

  it('takes a template after what is already on the agenda', () => {
    const meeting = opened();

    expect(meeting.snapshot().templateKey).toBe('weekly-check-in');
    expect(
      meeting.snapshot().topics.map((topic) => [topic.text, topic.source]),
    ).toEqual([
      ['Launch retro', 'CARRIED'],
      ['What went well this week?', 'TEMPLATE'],
    ]);
  });

  it("adds another template's questions after everything, keeping the first's, each naming its own", () => {
    const meeting = opened();
    meeting.addTopic('topic-9', MINT, 'Career path', ADDED_AT);

    meeting.useTemplate({
      templateKey: 'career-conversation',
      questions: [
        'Where next?',
        ' Career path ',
        'Launch retro',
        'What went well this week?',
      ],
      newTopicId: () => 'topic-10',
      at: ADDED_AT,
    });

    const { templateKey, topics } = meeting.snapshot();
    expect(templateKey).toBe('career-conversation');
    // A question already on the agenda, from a person, last time or another template, is not asked twice.
    expect(
      topics.map((topic) => [topic.text, topic.source, topic.templateKey]),
    ).toEqual([
      ['Launch retro', 'CARRIED', null],
      ['What went well this week?', 'TEMPLATE', 'weekly-check-in'],
      ['Career path', 'PERSON', null],
      ['Where next?', 'TEMPLATE', 'career-conversation'],
    ]);
    expect(topics.map((topic) => topic.position)).toEqual([0, 1, 2, 3]);
    expect(meeting.templatesInUse()).toEqual([
      'weekly-check-in',
      'career-conversation',
    ]);
  });

  it('takes a template once while any question it asked is on the agenda, and again once none is', () => {
    const meeting = opened();
    const useAgain = () =>
      meeting.useTemplate({
        templateKey: 'weekly-check-in',
        questions: ['What went well this week?'],
        newTopicId: () => 'topic-11',
        at: ADDED_AT,
      });

    expect(useAgain).toThrow(OneOnOneTemplateInUseError);

    meeting.removeTopic('topic-2', KRIT);
    useAgain();
    expect(meeting.snapshot().topics.at(-1)).toMatchObject({
      id: 'topic-11',
      templateKey: 'weekly-check-in',
    });
  });

  it('takes a template off with every question it asked, keeping the rest in order', () => {
    const meeting = opened();
    meeting.addTopic('topic-9', MINT, 'Career path', ADDED_AT);
    meeting.useTemplate({
      templateKey: 'career-conversation',
      questions: ['Where next?'],
      newTopicId: () => 'topic-10',
      at: ADDED_AT,
    });

    meeting.removeTemplate('weekly-check-in');

    const { templateKey, topics } = meeting.snapshot();
    expect(
      topics.map((topic) => [topic.text, topic.templateKey, topic.position]),
    ).toEqual([
      ['Launch retro', null, 0],
      ['Career path', null, 1],
      ['Where next?', 'career-conversation', 2],
    ]);
    // The template used last is the last still on the agenda.
    expect(templateKey).toBe('career-conversation');

    meeting.removeTemplate('career-conversation');
    expect(meeting.snapshot().templateKey).toBeNull();
    expect(meeting.templatesInUse()).toEqual([]);
  });

  it('leaves the agenda as it is when the template taken off is not on it', () => {
    const meeting = opened();
    const before = meeting.snapshot();

    meeting.removeTemplate('career-conversation');

    expect(meeting.snapshot()).toEqual(before);
  });

  it('takes no template off once it has started, or is finished', () => {
    const meeting = started();
    expect(() => meeting.removeTemplate('weekly-check-in')).toThrow(
      OneOnOneMeetingAlreadyStartedError,
    );
    meeting.finish(MINT, LATER);
    expect(() => meeting.removeTemplate('weekly-check-in')).toThrow(
      OneOnOneMeetingFinishedError,
    );
  });

  it('takes no template once it has started, or is finished', () => {
    const use = (meeting: OneOnOneMeeting) => () =>
      meeting.useTemplate({
        templateKey: 'career-conversation',
        questions: ['Where next?'],
        newTopicId: () => 'topic-10',
        at: ADDED_AT,
      });
    const meeting = started();
    expect(use(meeting)).toThrow(OneOnOneMeetingAlreadyStartedError);
    meeting.finish(MINT, LATER);
    expect(use(meeting)).toThrow(OneOnOneMeetingFinishedError);
  });

  it('takes topics from either person, at the end', () => {
    const meeting = opened();
    meeting.addTopic('topic-9', MINT, '  Career path  ', ADDED_AT);

    const added = meeting.snapshot().topics.at(-1);
    expect(added).toMatchObject({
      text: 'Career path',
      source: 'PERSON',
      authorAccountId: MINT,
      position: 2,
    });
  });

  it('refuses a blank topic, or one over 200 characters', () => {
    expect(() => opened().addTopic('t', KRIT, '  ', ADDED_AT)).toThrow(
      OneOnOneMeetingTextInvalidError,
    );
    expect(() =>
      opened().addTopic('t', KRIT, 'x'.repeat(201), ADDED_AT),
    ).toThrow(OneOnOneMeetingTextInvalidError);
  });

  it('lets only the author remove what they wrote, and anyone remove the rest', () => {
    const meeting = opened();
    meeting.addTopic('topic-9', MINT, 'Career path', ADDED_AT);

    expect(() => meeting.removeTopic('topic-9', KRIT)).toThrow(
      OneOnOneTopicNotYoursError,
    );
    meeting.removeTopic('topic-1', MINT);
    meeting.removeTopic('topic-9', MINT);

    expect(meeting.snapshot().topics.map((topic) => topic.id)).toEqual([
      'topic-2',
    ]);
    expect(meeting.snapshot().topics[0]?.position).toBe(0);
  });

  it('is reordered by either person, naming every topic once', () => {
    const meeting = opened();
    meeting.reorder(['topic-2', 'topic-1']);

    expect(meeting.snapshot().topics.map((topic) => topic.id)).toEqual([
      'topic-2',
      'topic-1',
    ]);
    expect(() => meeting.reorder(['topic-1'])).toThrow(
      OneOnOneTopicOrderInvalidError,
    );
    expect(() => meeting.reorder(['topic-1', 'topic-1'])).toThrow(
      OneOnOneTopicOrderInvalidError,
    );
  });

  it('takes no notes and no ticks before it starts', () => {
    expect(() =>
      opened().writeTopicNote('topic-1', KRIT, 'Went well', null, NOW),
    ).toThrow(OneOnOneMeetingNotStartedError);
    expect(() => opened().markDiscussed('topic-1', true, NOW)).toThrow(
      OneOnOneMeetingNotStartedError,
    );
  });
});

describe('a meeting in progress', () => {
  it('is started once, by either person, for the occurrence it stands for', () => {
    const meeting = started();

    expect(meeting.state()).toBe('IN_PROGRESS');
    expect(meeting.snapshot().occursAt).toEqual(NOW);
    expect(() => meeting.start(MINT, NOW, NOW)).toThrow(
      OneOnOneMeetingAlreadyStartedError,
    );
  });

  it('takes a shared note on a topic from either person', () => {
    const meeting = started();
    meeting.writeTopicNote('topic-1', MINT, ' Shipped on time ', null, NOW);

    expect(meeting.snapshot().topics[0]).toMatchObject({
      notes: 'Shipped on time',
      notesUpdatedAt: NOW,
      notesUpdatedByAccountId: MINT,
    });
  });

  it('refuses a note that would overwrite what the other wrote since it was read', () => {
    const meeting = started();
    meeting.writeTopicNote('topic-1', MINT, 'Mint wrote', null, LATER);

    expect(() =>
      meeting.writeTopicNote('topic-1', KRIT, 'Krit wrote', NOW, LATER),
    ).toThrow(OneOnOneTopicChangedError);
    meeting.writeTopicNote('topic-1', KRIT, 'Krit wrote', LATER, LATER);
    expect(meeting.snapshot().topics[0]?.notes).toBe('Krit wrote');
  });

  it('lets one person keep writing their own note without reading it back', () => {
    const meeting = started();
    meeting.writeTopicNote('topic-1', KRIT, 'First', null, NOW);
    meeting.writeTopicNote('topic-1', KRIT, 'Second', null, LATER);

    expect(meeting.snapshot().topics[0]?.notes).toBe('Second');
  });

  it('ticks a topic discussed, or not, and knows what was not reached', () => {
    const meeting = started();
    meeting.markDiscussed('topic-1', true, NOW);

    expect(meeting.undiscussed()).toEqual(['What went well this week?']);
    meeting.markDiscussed('topic-1', false, NOW);
    expect(meeting.undiscussed()).toHaveLength(2);
  });

  it('says so of a topic that is not on it', () => {
    expect(() => started().markDiscussed('topic-x', true, NOW)).toThrow(
      OneOnOneTopicNotFoundError,
    );
  });
});

describe('a finished meeting', () => {
  it('is finished by either person once started, and then takes nothing more', () => {
    expect(() => opened().finish(KRIT, NOW)).toThrow(
      OneOnOneMeetingNotStartedError,
    );
    const meeting = started();
    meeting.finish(MINT, LATER);

    expect(meeting.state()).toBe('FINISHED');
    expect(meeting.snapshot().finishedByAccountId).toBe(MINT);
    expect(() => meeting.addTopic('t', KRIT, 'More', ADDED_AT)).toThrow(
      OneOnOneMeetingFinishedError,
    );
    expect(() => meeting.finish(KRIT, LATER)).toThrow(
      OneOnOneMeetingFinishedError,
    );
  });
});

describe('what a next meeting carries over', () => {
  it('carries what was not talked about, in agenda order', () => {
    expect(
      undiscussedOf([
        { text: 'Second', position: 1, discussedAt: null },
        { text: 'Done', position: 2, discussedAt: NOW },
        { text: 'First', position: 0, discussedAt: null },
      ]),
    ).toEqual(['First', 'Second']);
  });
});
