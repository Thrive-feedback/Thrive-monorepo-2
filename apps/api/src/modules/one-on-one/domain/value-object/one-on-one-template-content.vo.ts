import { MAX_TOPIC_LENGTH } from '../entity/one-on-one-meeting.entity';
import { OneOnOneTemplateInvalidError } from '../one-on-one-template.errors';

export const MAX_TEMPLATE_NAME_LENGTH = 60;
export const MAX_TEMPLATE_SUGGESTED_WHEN_LENGTH = 120;
/** Each question becomes a topic on the agenda, so it is held to a topic's length. */
export const MAX_TEMPLATE_QUESTION_LENGTH = MAX_TOPIC_LENGTH;
export const MAX_TEMPLATE_QUESTIONS = 12;

export interface OneOnOneTemplateContentSnapshot {
  readonly name: string;
  /** When to use it; empty when its writer said nothing. */
  readonly suggestedWhen: string;
  /** The questions each agenda opens with, in order. */
  readonly questions: readonly string[];
}

/** Two questions that differ only in spacing or letter case are the same question. */
function sameQuestion(question: string): string {
  return question.replace(/\s+/g, ' ').toLowerCase();
}

/**
 * What a kept 1:1 template says: its name, when to use it, and the questions an agenda opens with,
 * each trimmed. A name, and at least one question, are required; no question is asked twice.
 */
export class OneOnOneTemplateContent {
  private constructor(
    private readonly content: OneOnOneTemplateContentSnapshot,
  ) {}

  static of(input: {
    readonly name: string;
    readonly suggestedWhen?: string;
    readonly questions: readonly string[];
  }): OneOnOneTemplateContent {
    const name = input.name.trim();
    const suggestedWhen = (input.suggestedWhen ?? '').trim();
    const questions = input.questions.map((question) => question.trim());
    if (name === '') {
      throw new OneOnOneTemplateInvalidError('it needs a name.');
    }
    if (name.length > MAX_TEMPLATE_NAME_LENGTH) {
      throw new OneOnOneTemplateInvalidError(
        `its name is at most ${MAX_TEMPLATE_NAME_LENGTH} characters.`,
      );
    }
    if (suggestedWhen.length > MAX_TEMPLATE_SUGGESTED_WHEN_LENGTH) {
      throw new OneOnOneTemplateInvalidError(
        `when to use it is at most ${MAX_TEMPLATE_SUGGESTED_WHEN_LENGTH} characters.`,
      );
    }
    if (questions.length === 0) {
      throw new OneOnOneTemplateInvalidError('it needs at least one question.');
    }
    if (questions.length > MAX_TEMPLATE_QUESTIONS) {
      throw new OneOnOneTemplateInvalidError(
        `it has at most ${MAX_TEMPLATE_QUESTIONS} questions.`,
      );
    }
    if (questions.some((question) => question === '')) {
      throw new OneOnOneTemplateInvalidError('a question is empty.');
    }
    if (
      questions.some(
        (question) => question.length > MAX_TEMPLATE_QUESTION_LENGTH,
      )
    ) {
      throw new OneOnOneTemplateInvalidError(
        `a question is at most ${MAX_TEMPLATE_QUESTION_LENGTH} characters.`,
      );
    }
    if (new Set(questions.map(sameQuestion)).size !== questions.length) {
      throw new OneOnOneTemplateInvalidError('a question is asked twice.');
    }
    return new OneOnOneTemplateContent({ name, suggestedWhen, questions });
  }

  /** Rebuilds what is already stored; only the repository calls this. */
  static restore(
    snapshot: OneOnOneTemplateContentSnapshot,
  ): OneOnOneTemplateContent {
    return new OneOnOneTemplateContent(snapshot);
  }

  /** The name compared for being taken, whatever its letter case and spacing. */
  nameKey(): string {
    return sameQuestion(this.content.name);
  }

  snapshot(): OneOnOneTemplateContentSnapshot {
    return this.content;
  }
}
