import {
  type AiAnswer,
  AiCompleter,
  type AiCompletion,
} from '@app/shared/application/ai-completer.port';

/** A well-formed summary with nothing in it, which every section is allowed to be. */
const NOTHING_TO_SAY = {
  language: 'en',
  themes: [],
  strengths: [],
  areas_to_improve: [],
  suggested_actions: [],
};

/**
 * Answers whatever a test told it to, and records what it was asked.
 *
 * Every suite uses it: a real call costs money, takes seconds and answers differently each time,
 * so no scenario and no unit test may depend on what a model would have said (ADR 0077). What is
 * worth asserting is the shape of the question and what the caller does with the answer.
 */
export class FakeAiCompleter extends AiCompleter {
  readonly asked: AiCompletion[] = [];
  private answers: unknown[] = [];
  private answerFor: ((asked: AiCompletion) => unknown) | undefined;
  private refusing = false;

  /** Back to how it started, so one scenario's setup does not reach the next. */
  reset(): void {
    this.asked.length = 0;
    this.answers = [];
    this.answerFor = undefined;
    this.refusing = false;
  }

  /** The answers to give, in order. The last one stands for every call after it. */
  answering(...answers: unknown[]): this {
    this.answers = answers;
    return this;
  }

  /**
   * An answer built from the question, for the one thing a fixed answer cannot do: cite the
   * messages it was actually given, whose ids only exist once the corpus has been read.
   */
  answeringWith(answer: (asked: AiCompletion) => unknown): this {
    this.answerFor = answer;
    return this;
  }

  /** For proving a caller leaves what stands rather than storing half an answer. */
  refusingEverything(): this {
    this.refusing = true;
    return this;
  }

  async complete(completion: AiCompletion): Promise<AiAnswer> {
    this.asked.push(completion);
    if (this.refusing) {
      throw new Error('the model did not answer');
    }
    if (this.answerFor) {
      return { content: this.answerFor(completion) };
    }
    const answer =
      this.answers[Math.min(this.asked.length - 1, this.answers.length - 1)];
    // A summary saying nothing rather than a refusal, because every scenario that writes
    // Feedback enqueues a refresh whether or not it is about summaries, and a scenario that
    // never mentions them should not have to set one up.
    return { content: answer ?? NOTHING_TO_SAY };
  }
}
