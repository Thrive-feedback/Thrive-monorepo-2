import { describe, expect, it } from 'bun:test';
import { FakeAiCompleter } from '@test/support/ai.fake';
import { FakeClock } from '@test/support/clock.fake';
import {
  FakeFeedbackSummaryRepository,
  FakeSummaryCorpusQuery,
} from '@test/support/feedback-summary.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeOutbox } from '@test/support/outbox.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import { SUMMARY_REFRESH_TYPE } from '../adapter/feedback-summary-outbox.adapter';
import type { SummarySourceRow } from '../query-port/summary-corpus.query-port';
import {
  SUMMARY_PROMPT_VERSION,
  SummaryPromptService,
} from '../service/summary-prompt.service';
import { GetMyFeedbackSummaryUseCase } from './get-my-feedback-summary.use-case';
import { RefreshFeedbackSummaryUseCase } from './refresh-feedback-summary.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-00000000000a';
const ANN = 'account-ann';
const FENCE_ID = '0199a0f0-0000-7000-8000-0000000000fe';
const SUMMARY_ID = '0199a0f0-0000-7000-8000-0000000000s1';
const NOW = new Date('2026-11-08T09:00:00.000Z');
/** The quarter `NOW` falls in, which is what the route reads when nobody names one. */
const THIS_PERIOD = '2026-Q4';

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

function setUp(sources: readonly SummarySourceRow[] = THREE_MESSAGES) {
  const corpus = new FakeSummaryCorpusQuery().with(...sources);
  const summaries = new FakeFeedbackSummaryRepository();
  const outbox = new FakeOutbox();
  const completer = new FakeAiCompleter().answering({
    language: 'en',
    themes: [{ point: 'Clear in review', sources: ['one'] }],
    strengths: [],
    areas_to_improve: [],
    suggested_actions: [],
  });
  const refresh = new RefreshFeedbackSummaryUseCase(
    corpus,
    summaries,
    new SummaryPromptService(),
    completer,
    // Two per generation: the corpus fence, then the summary's own id.
    new FakeIdGenerator(FENCE_ID, SUMMARY_ID, FENCE_ID, SUMMARY_ID),
    new FakeClock(NOW),
    new FakeUnitOfWork(),
  );
  const useCase = new GetMyFeedbackSummaryUseCase(
    summaries,
    corpus,
    outbox,
    new FakeClock(NOW),
    new FakeUnitOfWork(),
  );
  const reading = (period: string | null = null) =>
    useCase.execute({ workspaceId: WORKSPACE_ID, accountId: ANN, period });
  /** Writes the summary the way the outbox would, so a spec can read a stored one. */
  const generate = () =>
    refresh.execute({
      workspaceId: WORKSPACE_ID,
      accountId: ANN,
      period: THIS_PERIOD,
    });
  return { corpus, outbox, summaries, reading, generate };
}

describe('reading a summary that does not exist yet', () => {
  it('answers with nothing, and asks for one to be written', async () => {
    const { outbox, reading } = setUp();

    expect(await reading()).toBeNull();
    expect(outbox.ofType(SUMMARY_REFRESH_TYPE)).toHaveLength(1);
  });

  it('asks for nothing below the floor, where a summary is worse than the list', async () => {
    const { outbox, reading } = setUp(THREE_MESSAGES.slice(0, 2));

    expect(await reading()).toBeNull();
    expect(outbox.enqueued).toHaveLength(0);
  });

  it('reads the quarter today falls in when the caller names none', async () => {
    const { outbox, reading } = setUp();

    await reading();

    expect(outbox.ofType(SUMMARY_REFRESH_TYPE)[0]?.payload).toMatchObject({
      period: THIS_PERIOD,
    });
  });
});

describe('reading a summary that is current', () => {
  it('answers with it and asks for nothing', async () => {
    const { outbox, reading, generate } = setUp();
    await generate();

    const read = await reading();

    expect(read?.isStale).toBe(false);
    expect(read?.sections.themes).toHaveLength(1);
    expect(outbox.enqueued).toHaveLength(0);
  });
});

describe('reading a summary an older prompt wrote', () => {
  it('asks for a new one although no Feedback has arrived since', async () => {
    const { outbox, reading, generate, summaries } = setUp();
    await generate();
    summaries.pretendWrittenBy(1);

    const read = await reading();

    // Not stale to the person: nothing new was written to them, and the rewrite is Thrive's
    // business rather than something to put on the page.
    expect(read?.isStale).toBe(false);
    expect(outbox.ofType(SUMMARY_REFRESH_TYPE)).toHaveLength(1);
  });

  it('asks under a key the already-delivered one cannot swallow', async () => {
    const { outbox, reading, generate, summaries } = setUp();
    await generate();
    summaries.pretendWrittenBy(1);

    await reading();

    expect(outbox.ofType(SUMMARY_REFRESH_TYPE)[0]?.idempotencyKey).toContain(
      `:v${SUMMARY_PROMPT_VERSION}:`,
    );
  });
});

describe('reading a summary that is behind', () => {
  it('answers with it, says so, and asks for a new one', async () => {
    const { corpus, outbox, reading, generate } = setUp();
    await generate();
    corpus.with(...THREE_MESSAGES, aSource('four', '2026-11-07T00:00:00.000Z'));

    const read = await reading();

    expect(read?.isStale).toBe(true);
    expect(outbox.ofType(SUMMARY_REFRESH_TYPE)).toHaveLength(1);
  });

  it('asks once however often the page is opened, because the key names the newest message', async () => {
    const { corpus, outbox, reading, generate } = setUp();
    await generate();
    corpus.with(...THREE_MESSAGES, aSource('four', '2026-11-07T00:00:00.000Z'));

    await reading();
    await reading();

    const [first, second] = outbox.ofType(SUMMARY_REFRESH_TYPE);
    expect(first?.idempotencyKey).toBe(second?.idempotencyKey);
    expect(first?.idempotencyKey).toContain('four');
  });
});
