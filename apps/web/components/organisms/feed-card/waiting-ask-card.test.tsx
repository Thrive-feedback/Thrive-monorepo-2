import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { WaitingAskCard } from './waiting-ask-card';
import { noteLieOf, WAITING_ASK_NOTE_LIES } from './waiting-ask-note';

const ASK: MyAsk = {
  askId: 'ask-1',
  message: 'How clear was the migration plan?',
  messageTags: NO_TEXT_TAGS,
  requesterName: 'Ann Lee',
  requesterPhotoUrl: null,
  requesterInactive: false,
  askedAt: '2026-10-31T03:00:00.000Z',
  status: 'PENDING',
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-02T03:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

function draw(ask: Partial<MyAsk> = {}) {
  render(
    <WaitingAskCard ask={{ ...ASK, ...ask }} target={{ href: '/opened' }} />,
  );
  return screen.getByRole('article');
}

describe('WaitingAskCard', () => {
  it('says who asked, when, and what', () => {
    const card = draw();

    expect(card).toHaveTextContent('Ann Lee requested feedback from you');
    expect(card).toHaveTextContent('2 days ago');
    expect(card).toHaveTextContent('How clear was the migration plan?');
  });

  it('opens the postcard from the small postcard, its one link', () => {
    const card = within(draw());

    expect(card.getAllByRole('link')).toHaveLength(1);
    expect(
      card.getByRole('link', {
        name: 'Answer in the postcard: Ann Lee requested feedback from you',
      }),
    ).toHaveAttribute('href', '/opened');
  });

  it('points to the small postcard in handwriting', () => {
    expect(draw()).toHaveTextContent('Answer in the postcard');
  });

  it('says nothing about who can read the answer', () => {
    expect(draw()).not.toHaveTextContent(/everyone|selected|workspace/i);
  });

  it('highlights what the Request message was bound to', () => {
    const card = within(
      draw({
        message: 'Did @ben show #Ownership?',
        messageTags: {
          mentions: [{ slug: 'ben', displayName: 'Ben' }],
          workspaceGoals: [{ name: 'Ownership' }],
        },
      }),
    );

    expect(card.getByText('@Ben')).toBeVisible();
    expect(card.getByText('#Ownership')).toBeVisible();
  });

  it('still reads for somebody who has not introduced themselves', () => {
    const card = within(draw({ requesterName: null }));

    expect(
      card.getByRole('link', {
        name: /^Answer in the postcard: .+ requested feedback from you$/,
      }),
    ).toBeVisible();
  });
});

describe('noteLieOf', () => {
  it('keeps the same note for the same Ask', () => {
    expect(noteLieOf('ask-1')).toBe(noteLieOf('ask-1'));
  });

  it('spreads Asks made moments apart across the ways', () => {
    const lies = [
      '01a19257-62f1-7631-b7f6-3b9219d64c02',
      '01a19257-62fd-703f-9ec7-877ab4e0f6ce',
      '01a19257-630b-716a-8882-ca70833195f3',
      '01a19295-8822-70ef-8c79-62c6f3530a08',
      '01a19182-94a0-7465-a88e-a10a869dc5e1',
      '01a19182-948b-7a11-9c3e-5d2f0b1e7a44',
    ].map(noteLieOf);

    expect(new Set(lies).size).toBeGreaterThanOrEqual(3);
  });

  it('reaches all five ways across a few Asks', () => {
    const lies = ['ask-1', 'ask-2', 'ask-3', 'ask-4', 'ask-5'].map(noteLieOf);

    expect(new Set(lies)).toEqual(new Set(WAITING_ASK_NOTE_LIES));
  });
});
