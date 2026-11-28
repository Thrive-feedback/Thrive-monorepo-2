import { describe, expect, it } from 'vitest';
import { agendaOf } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-agenda.transform';
import type { NextMeeting } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';

const TOPIC = {
  id: '0196b4c8-0000-7000-8000-0000000000a1',
  text: 'Career path',
  source: 'PERSON' as const,
  authorAccountId: 'account-ben',
  position: 0,
  notes: '',
  notesUpdatedAt: null,
  notesUpdatedByAccountId: null,
  discussedAt: null,
  broughtFrom: null,
  templateKey: null,
};

describe('the next meeting’s agenda', () => {
  it('is what it will open with before anybody writes: what was not reached last time, keyed by place', () => {
    const next: NextMeeting = {
      meeting: null,
      carried: ['Launch retro', 'Hiring'],
      templateQuestions: [],
      templates: [],
      carriedFromSkipped: null,
      carriedTopics: [],
      templateName: null,
    };

    expect(agendaOf(next)).toEqual([
      {
        key: 'preview-0',
        text: 'Launch retro',
        source: 'CARRIED',
        authorAccountId: null,
        topic: null,
      },
      {
        key: 'preview-1',
        text: 'Hiring',
        source: 'CARRIED',
        authorAccountId: null,
        topic: null,
      },
    ]);
  });

  it('is the open meeting’s topics, each keyed by its id and holding it', () => {
    const next: NextMeeting = {
      meeting: {
        id: '0196b4c8-0000-7000-8000-0000000000b1',
        state: 'PREPARING',
        templateKey: 'weekly-check-in',
        occursAt: null,
        startedAt: null,
        startedByAccountId: null,
        finishedAt: null,
        finishedByAccountId: null,
        topics: [TOPIC],
      },
      carried: [],
      templateQuestions: [],
      templates: [],
      carriedFromSkipped: null,
      carriedTopics: [],
      templateName: 'Weekly check-in',
    };

    expect(agendaOf(next)).toEqual([
      {
        key: TOPIC.id,
        text: 'Career path',
        source: 'PERSON',
        authorAccountId: 'account-ben',
        topic: TOPIC,
      },
    ]);
  });
});
