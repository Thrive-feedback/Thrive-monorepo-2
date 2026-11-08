import { AiCompleter } from '@app/shared/application/ai-completer.port';
import { Clock } from '@app/shared/application/clock.port';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { FeedbackSummary } from '../../domain/entity/feedback-summary.entity';
import { FeedbackSummaryRepository } from '../../domain/repository/feedback-summary-repository.port';
import { SummaryPeriod } from '../../domain/value-object/summary-period.vo';
import {
  SUMMARY_SECTIONS,
  SummarySection,
} from '../../domain/value-object/summary-section.vo';
import {
  SummaryCorpusQuery,
  type SummarySourceRow,
} from '../query-port/summary-corpus.query-port';
import {
  SUMMARY_MAX_ANSWER_TOKENS,
  SUMMARY_PROMPT_VERSION,
  SummaryPromptService,
  summaryAnswerSchema,
} from '../service/summary-prompt.service';

/**
 * How many distinct messages a period needs before a summary is worth writing (design 0025 D7).
 * A summary of one message is that message, reworded and less accurate; below the floor the page
 * shows the Feedback itself, which is better in every way.
 */
export const SUMMARY_SOURCE_FLOOR = 3;

/**
 * One attempt per run, not the adapter's three.
 *
 * The relay gives a handler 30 s (ADR 0076) and a capped generation measured ~13 s, so a second
 * attempt inside one run cannot finish — it would be cut off mid-call with the tokens already
 * spent. Retrying is the outbox's job here, spaced by its own backoff.
 */
const ATTEMPTS_PER_RUN = 1;

export interface RefreshFeedbackSummaryInput {
  readonly workspaceId: string;
  readonly accountId: string;
  readonly period: string;
}

const point = z.object({
  point: z.string().min(1),
  sources: z.array(z.string().min(1)),
});

const answer = z.object({
  language: z.enum(['th', 'en', 'mixed']),
  themes: z.array(point),
  strengths: z.array(point),
  areas_to_improve: z.array(point),
  suggested_actions: z.array(point),
});

/**
 * Writes the summary of one Member's period, from their own Feedback and Kudos.
 *
 * Called by the outbox and by nothing else: generation is slow and costs money per run, so it
 * never sits on a request a person is waiting on (design 0025 D4). Idempotent, as every outbox
 * handler must be — it reads the corpus again and replaces the row.
 */
@Injectable()
export class RefreshFeedbackSummaryUseCase {
  constructor(
    private readonly corpus: SummaryCorpusQuery,
    private readonly summaries: FeedbackSummaryRepository,
    private readonly prompt: SummaryPromptService,
    private readonly completer: AiCompleter,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: RefreshFeedbackSummaryInput): Promise<void> {
    const period = SummaryPeriod.of(input.period);
    const sources = await this.corpus.writtenTo(
      input.workspaceId,
      input.accountId,
      period.range(),
    );

    if (sources.length < SUMMARY_SOURCE_FLOOR) {
      // Costs no tokens, and leaves whatever stands: a Member whose Feedback was erased keeps
      // no summary of it, because erasing goes through `ForgetPersonPort`, not through here.
      return;
    }

    const written = await this.completer.complete({
      system: this.prompt.system(),
      prompt: this.prompt.corpus(sources),
      answerSchema: summaryAnswerSchema(),
      maxAnswerTokens: SUMMARY_MAX_ANSWER_TOKENS,
      maxAttempts: ATTEMPTS_PER_RUN,
    });

    const parsed = answer.safeParse(written.content);
    if (!parsed.success) {
      throw new Error('The model answered in a shape the summary cannot read');
    }

    const kindOf = new Map(sources.map((source) => [source.id, source.kind]));
    const sections = SUMMARY_SECTIONS.map((name) =>
      SummarySection.of(
        name,
        parsed.data[name].map((written) => ({
          point: written.point,
          sources: written.sources.map((id) => {
            const kind = kindOf.get(id);
            if (kind === undefined) {
              // The whole answer, not the point: a citation outside the corpus means the model was
              // writing about something it was not given, and the rest of the answer was written by
              // the same pass. Repairing it would keep whatever else came from the same mistake.
              throw new Error('The model cited a message it was not given');
            }
            // The kind is this code's to add, not the model's to be trusted with: it comes from the
            // corpus that was sent, so a point can be followed back to the right page.
            return { id, kind };
          }),
        })),
      ),
    );

    const summary = FeedbackSummary.written({
      id: this.idGenerator.next(),
      accountId: input.accountId,
      workspaceId: input.workspaceId,
      period,
      language: parsed.data.language,
      sections,
      sourceCount: sources.length,
      sourceWatermark: newestOf(sources),
      promptVersion: SUMMARY_PROMPT_VERSION,
      generatedAt: this.clock.now(),
    });

    await this.unitOfWork.run(async () => {
      await this.summaries.save(summary);
    });
  }
}

/** The corpus is read oldest first, so the watermark is the last row's instant. */
function newestOf(sources: readonly SummarySourceRow[]): Date {
  return sources.reduce(
    (newest, source) => (source.createdAt > newest ? source.createdAt : newest),
    sources[0]?.createdAt ?? new Date(0),
  );
}
