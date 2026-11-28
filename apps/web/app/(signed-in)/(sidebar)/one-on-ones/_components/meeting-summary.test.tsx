import { describe, expect, it } from 'vitest';
import {
  type TopicOrigin,
  topicSourceOf,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/meeting-summary';

const ME = 'account-me';
const MINT = 'account-mint';
const PEOPLE = {
  readerAccountId: ME,
  readerName: 'Krit',
  otherAccountId: MINT,
  otherName: 'Mint',
};
const TEMPLATES = [{ key: 'weekly-check-in', name: 'Weekly check-in' }];

function origin(overrides: Partial<TopicOrigin>): TopicOrigin {
  return {
    source: 'PERSON',
    authorAccountId: ME,
    broughtFrom: null,
    templateKey: null,
    ...overrides,
  };
}

describe('where a topic came from', () => {
  it.each([
    [
      'a template, by its name',
      origin({
        source: 'TEMPLATE',
        authorAccountId: null,
        templateKey: 'weekly-check-in',
      }),
      'From Weekly check-in',
    ],
    [
      'a template not named',
      origin({
        source: 'TEMPLATE',
        authorAccountId: null,
        templateKey: 'gone',
      }),
      'From a template',
    ],
    [
      'Feedback',
      origin({ broughtFrom: { kind: 'FEEDBACK', id: 'f-1' } }),
      'From Feedback',
    ],
    [
      'Kudos',
      origin({ broughtFrom: { kind: 'KUDOS', id: 'k-1' } }),
      'From Kudos',
    ],
    [
      'an Ask still open',
      origin({ broughtFrom: { kind: 'ASK', id: 'a-1' } }),
      'From an open ask',
    ],
    [
      'last time',
      origin({ source: 'CARRIED', authorAccountId: null }),
      'From last time',
    ],
    ['the reader', origin({}), 'Added by You'],
    ['the other person', origin({ authorAccountId: MINT }), 'Added by Mint'],
  ])('says it came from %s', (_, topic, said) => {
    expect(topicSourceOf(topic, { templates: TEMPLATES, people: PEOPLE })).toBe(
      said,
    );
  });

  it("falls back to the meeting's template for a topic stored before topics named theirs", () => {
    expect(
      topicSourceOf(origin({ source: 'TEMPLATE', authorAccountId: null }), {
        templates: [],
        templateName: 'Career conversation',
        people: PEOPLE,
      }),
    ).toBe('From Career conversation');
  });

  it('says first that it was written for a day since skipped', () => {
    expect(
      topicSourceOf(origin({ source: 'CARRIED' }), {
        templates: TEMPLATES,
        people: PEOPLE,
        carriedFrom: '2026-11-26',
      }),
    ).toBe('From Thu 26 Nov (skipped)');
  });
});
