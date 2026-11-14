import { describe, expect, it } from 'bun:test';
import { feedbackSummaryResponseSchema } from './feedback-summary.dto';

/**
 * A guard on the shape of the answer, not on one handler.
 *
 * Brain `ADR-0051` d7 says a summary reaches nobody but the person it is about, and design
 * 0025 D8 makes that a property of the route rather than a check somebody could widen. These
 * assertions fail the moment a field would carry somebody's name, somebody's id, or a copy of
 * what a colleague wrote — the three ways this could stop being true without anybody noticing.
 *
 * The schema **strips** what it does not name rather than refusing it, so these read the parsed
 * answer: what matters is that the field never reaches the wire, however it got into the object
 * a handler returned.
 */
/** One cited message, as the route answers with it. */
function aSource() {
  return { id: crypto.randomUUID(), kind: 'FEEDBACK' as const };
}

const summary = {
  period: '2026-Q4',
  generatedAt: '2026-11-08T09:00:00.000Z',
  isStale: false,
  sourceCount: 3,
  language: 'en' as const,
  themes: [{ point: 'Clear in review', sources: [aSource()] }],
  strengths: [],
  areas_to_improve: [],
  suggested_actions: [],
};

describe('what the summary route may answer with', () => {
  it('accepts a summary carrying points and the ids behind them', () => {
    expect(
      feedbackSummaryResponseSchema.safeParse({ summary, isAvailable: true })
        .success,
    ).toBe(true);
  });

  it('names nobody: an account id never reaches the wire', () => {
    const parsed = feedbackSummaryResponseSchema.parse({
      isAvailable: true,
      summary: { ...summary, accountId: 'account-ann' },
    });

    expect(parsed.summary).not.toHaveProperty('accountId');
    expect(JSON.stringify(parsed)).not.toContain('account-ann');
  });

  it('carries nobody else’s words: a message beside a point never reaches the wire', () => {
    const parsed = feedbackSummaryResponseSchema.parse({
      isAvailable: true,
      summary: {
        ...summary,
        themes: [
          {
            point: 'Clear in review',
            sources: [aSource()],
            message: 'You explain tricky things clearly.',
          },
        ],
      },
    });

    expect(JSON.stringify(parsed)).not.toContain('tricky things');
  });

  it('cites ids rather than anything readable, so a source cannot smuggle text', () => {
    expect(
      feedbackSummaryResponseSchema.safeParse({
        isAvailable: true,
        summary: {
          ...summary,
          themes: [
            {
              point: 'Clear in review',
              sources: [{ id: 'Ann said you were clear', kind: 'FEEDBACK' }],
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it('says which kind each source is, so a point leads to the page that holds it', () => {
    expect(
      feedbackSummaryResponseSchema.safeParse({
        isAvailable: true,
        summary: {
          ...summary,
          themes: [
            {
              point: 'Clear in review',
              sources: [{ id: crypto.randomUUID(), kind: 'SOMETHING_ELSE' }],
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it('answers nothing when there is nothing to show, rather than an empty summary', () => {
    expect(
      feedbackSummaryResponseSchema.safeParse({
        summary: null,
        isAvailable: true,
      }).success,
    ).toBe(true);
  });
});
