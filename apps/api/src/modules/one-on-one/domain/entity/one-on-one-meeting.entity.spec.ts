import { describe, expect, it } from 'bun:test';
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
import {
  OneOnOneMeeting,
  openingAgenda,
  undiscussedOf,
} from './one-on-one-meeting.entity';

const KRIT = 'account-krit';
const MINT = 'account-mint';
const NOW = new Date('2026-11-26T03:00:00.000Z');
const LATER = new Date('2026-11-26T03:10:00.000Z');

function opened() {
  let next = 0;
  return OneOnOneMeeting.open({
    id: 'meeting-1',
    workspaceId: 'workspace-acme',
    oneOnOneId: 'one-on-one-1',
    templateKey: 'weekly-check-in',
    carried: ['Launch retro'],
    templateQuestions: ['What went well this week?'],
    newTopicId: () => {
      next += 1;
      return `topic-${next}`;
    },
  });
}

function started() {
  const meeting = opened();
  meeting.start(KRIT, NOW, NOW);
  return meeting;
}

describe('a meeting being prepared', () => {
  it('opens with what was not reached last time, then the template', () => {
    const meeting = opened();

    expect(meeting.state()).toBe('PREPARING');
    expect(
      meeting.snapshot().topics.map((topic) => [topic.text, topic.source]),
    ).toEqual([
      ['Launch retro', 'CARRIED'],
      ['What went well this week?', 'TEMPLATE'],
    ]);
  });

  it('does not ask a template question twice when it was carried over', () => {
    const meeting = OneOnOneMeeting.open({
      id: 'meeting-2',
      workspaceId: 'workspace-acme',
      oneOnOneId: 'one-on-one-1',
      templateKey: 'weekly-check-in',
      carried: ['What do you need from me?'],
      templateQuestions: ['What went well?', 'What do you need from me?'],
      newTopicId: () => crypto.randomUUID(),
    });

    expect(
      meeting.snapshot().topics.map((topic) => [topic.text, topic.source]),
    ).toEqual([
      ['What do you need from me?', 'CARRIED'],
      ['What went well?', 'TEMPLATE'],
    ]);
  });

  it('takes topics from either person, at the end', () => {
    const meeting = opened();
    meeting.addTopic('topic-9', MINT, '  Career path  ');

    const added = meeting.snapshot().topics.at(-1);
    expect(added).toMatchObject({
      text: 'Career path',
      source: 'PERSON',
      authorAccountId: MINT,
      position: 2,
    });
  });

  it('refuses a blank topic, or one over 200 characters', () => {
    expect(() => opened().addTopic('t', KRIT, '  ')).toThrow(
      OneOnOneMeetingTextInvalidError,
    );
    expect(() => opened().addTopic('t', KRIT, 'x'.repeat(201))).toThrow(
      OneOnOneMeetingTextInvalidError,
    );
  });

  it('lets only the author remove what they wrote, and anyone remove the rest', () => {
    const meeting = opened();
    meeting.addTopic('topic-9', MINT, 'Career path');

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
    expect(() => meeting.addTopic('t', KRIT, 'More')).toThrow(
      OneOnOneMeetingFinishedError,
    );
    expect(() => meeting.finish(KRIT, LATER)).toThrow(
      OneOnOneMeetingFinishedError,
    );
  });
});

describe('what a next meeting opens with', () => {
  it('asks a template question carried over once, however it was spaced', () => {
    expect(openingAgenda(['Wins '], ['Wins', 'Blockers'])).toEqual([
      { text: 'Wins ', source: 'CARRIED' },
      { text: 'Blockers', source: 'TEMPLATE' },
    ]);
  });

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
