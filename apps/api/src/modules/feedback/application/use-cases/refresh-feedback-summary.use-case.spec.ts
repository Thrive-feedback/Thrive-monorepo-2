import { describe, expect, it } from 'bun:test';
import { FakeAiCompleter } from '@test/support/ai.fake';
import { FakeClock } from '@test/support/clock.fake';
import {
  FakeFeedbackSummaryRepository,
  FakeSummaryCorpusQuery,
} from '@test/support/feedback-summary.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import type { SummarySourceRow } from '../query-port/summary-corpus.query-port';
import { SummaryPromptService } from '../service/summary-prompt.service';
import { RefreshFeedbackSummaryUseCase } from './refresh-feedback-summary.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-00000000000a';
const ANN = 'account-ann';
const FENCE_ID = '0199a0f0-0000-7000-8000-0000000000fe';
const SUMMARY_ID = '0199a0f0-0000-7000-8000-0000000000s1';
const PERIOD = '2026-Q4';
const NOW = new Date('2026-11-08T09:00:00.000Z');

function aSource(id: string, writtenAt: string): SummarySourceRow {
  return {
    id,
    kind: 'FEEDBACK',
    message: `message ${id}`,
    createdAt: new Date(writtenAt),
  };
}

const THREE_MESSAGES = [
  aSource('one', '2026-10-02T00:00:00.000Z'),
  aSource('two', '2026-10-09T00:00:00.000Z'),
  aSource('three', '2026-10-20T00:00:00.000Z'),
];

function anAnswer(overrides: Record<string, unknown> = {}) {
  return {
    language: 'en',
    themes: [{ point: 'Clear in review', sources: ['one'] }],
    strengths: [],
    areas_to_improve: [],
    suggested_actions: [],
    ...overrides,
  };
}

function setUp(sources: readonly SummarySourceRow[] = THREE_MESSAGES) {
  const corpus = new FakeSummaryCorpusQuery().with(...sources);
  const summaries = new FakeFeedbackSummaryRepository();
  const completer = new FakeAiCompleter();
  const useCase = new RefreshFeedbackSummaryUseCase(
    corpus,
    summaries,
    new SummaryPromptService(),
    completer,
    new FakeIdGenerator(FENCE_ID, SUMMARY_ID),
    new FakeClock(NOW),
    new FakeUnitOfWork(),
  );
  const refreshing = () =>
    useCase.execute({
      workspaceId: WORKSPACE_ID,
      accountId: ANN,
      period: PERIOD,
    });
  return { completer, corpus, summaries, refreshing };
}

describe('writing a summary', () => {
  it('stores what the model answered, with the period it covers', async () => {
    const { completer, summaries, refreshing } = setUp();
    completer.answering(anAnswer());

    await refreshing();

    const written = summaries.only();
    expect(written?.period).toBe(PERIOD);
    expect(written?.language).toBe('en');
    expect(written?.sections.themes).toEqual([
      { point: 'Clear in review', sources: [{ id: 'one', kind: 'FEEDBACK' }] },
    ]);
    expect(written?.sourceCount).toBe(3);
  });

  it('remembers the newest message it read, which is what makes it stale later', async () => {
    const { completer, summaries, refreshing } = setUp();
    completer.answering(anAnswer());

    await refreshing();

    expect(summaries.only()?.sourceWatermark).toEqual(
      new Date('2026-10-20T00:00:00.000Z'),
    );
  });

  it('asks the model once, leaving a retry to the outbox that can afford it', async () => {
    const { completer, refreshing } = setUp();
    completer.answering(anAnswer());

    await refreshing();

    expect(completer.asked[0]?.maxAttempts).toBe(1);
  });

  it('fills every section, so an unanswered one reads as empty rather than absent', async () => {
    const { completer, summaries, refreshing } = setUp();
    completer.answering(anAnswer());

    await refreshing();

    expect(summaries.only()?.sections.areas_to_improve).toEqual([]);
    expect(summaries.only()?.sections.suggested_actions).toEqual([]);
  });
});

describe('a period with too little in it', () => {
  it('writes nothing and costs no tokens, below the floor', async () => {
    const { completer, summaries, refreshing } = setUp(
      THREE_MESSAGES.slice(0, 2),
    );

    await refreshing();

    expect(completer.asked).toHaveLength(0);
    expect(summaries.count()).toBe(0);
  });
});

describe('an answer that cannot be trusted', () => {
  it('rejects the whole answer when a point cites a message that was never sent', async () => {
    const { completer, summaries, refreshing } = setUp();
    completer.answering(
      anAnswer({
        themes: [{ point: 'Invented', sources: ['a-message-nobody-wrote'] }],
      }),
    );

    await expect(refreshing()).rejects.toThrow(/cited a message/);
    expect(summaries.count()).toBe(0);
  });

  it('rejects an answer in a shape the summary cannot read', async () => {
    const { completer, summaries, refreshing } = setUp();
    completer.answering({ language: 'en', themes: 'not a list' });

    await expect(refreshing()).rejects.toThrow(/shape/);
    expect(summaries.count()).toBe(0);
  });

  it('leaves the summary that stands when the model does not answer at all', async () => {
    const { completer, summaries, refreshing } = setUp();
    completer.answering(anAnswer());
    await refreshing();
    const first = summaries.only();

    completer.refusingEverything();

    await expect(refreshing()).rejects.toThrow();
    expect(summaries.only()).toEqual(first);
  });
});

describe('a corpus bigger than one generation may read', () => {
  it('asks for the newest only, so a busy quarter cannot overflow the provider', async () => {
    const { completer, corpus, refreshing } = setUp();
    completer.answering(anAnswer());

    await refreshing();

    expect(corpus.limitsAsked).toEqual([200]);
  });
});

describe('a model that ignores its instructions', () => {
  it('drops a point that cites nothing, so nothing unprovable reaches a Member', async () => {
    const { completer, summaries, refreshing } = setUp();
    completer.answering(
      anAnswer({
        areas_to_improve: [
          { point: 'Invented, and citing nothing', sources: [] },
          { point: 'Grounded', sources: ['one'] },
        ],
      }),
    );

    await refreshing();

    expect(summaries.only()?.sections.areas_to_improve).toEqual([
      { point: 'Grounded', sources: [{ id: 'one', kind: 'FEEDBACK' }] },
    ]);
  });

  it('keeps a suggested action that cites nothing, which is the one section allowed to', async () => {
    const { completer, summaries, refreshing } = setUp();
    completer.answering(
      anAnswer({
        suggested_actions: [{ point: 'Park the detail', sources: [] }],
      }),
    );

    await refreshing();

    expect(summaries.only()?.sections.suggested_actions).toEqual([
      { point: 'Park the detail', sources: [] },
    ]);
  });

  it('cuts a section to its cap, so no provider can put sixteen points in front of a Member', async () => {
    const { completer, summaries, refreshing } = setUp();
    completer.answering(
      anAnswer({
        themes: Array.from({ length: 9 }, (_unused, index) => ({
          point: `theme ${index}`,
          sources: ['one'],
        })),
      }),
    );

    await refreshing();

    expect(summaries.only()?.sections.themes).toHaveLength(4);
  });
});
