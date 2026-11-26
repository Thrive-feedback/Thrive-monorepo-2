import { OneOnOneTemplateUnknownError } from '../one-on-one.errors';

/** One of the 1:1 templates Thrive ships, which nobody can change (brain ADR-0060 §8). */
export interface ThriveTemplateDetails {
  /** How a 1:1 names it as its default; stable, so a stored schedule always finds it. */
  readonly key: string;
  readonly name: string;
  /** When Thrive suggests it. */
  readonly suggestedWhen: string;
  readonly questions: readonly string[];
}

/**
 * Thrive's own 1:1 templates, the first set the prototype proposed (brain ADR-0060 §8, an
 * `ASSUMPTION` there). A Workspace's Admins and each Member keep their own beside these; these stay.
 *
 * A shipped `key` is permanent: 1:1s and meetings store it (ADR 0096), and a stored key Thrive no
 * longer has is a broken row. Never remove or rename one; to retire a template, hide it from the
 * list and keep it here.
 */
const THRIVE_TEMPLATES: readonly ThriveTemplateDetails[] = [
  {
    key: 'weekly-check-in',
    name: 'Weekly check-in',
    suggestedWhen: 'The default for every 1:1',
    questions: [
      'What went well this week?',
      "What's in your way?",
      'What do you need from me?',
    ],
  },
  {
    key: 'career-conversation',
    name: 'Career conversation',
    suggestedWhen: 'Suggested every 6 months',
    questions: [
      'Where do you want to be in two years?',
      'Which skills do you want to grow next?',
      'What work would stretch you?',
      'How can I help?',
    ],
  },
  {
    key: 'new-joiner',
    name: 'New joiner 30 / 60 / 90',
    suggestedWhen: "Weekly in a new joiner's first 90 days",
    questions: [
      'What has surprised you so far?',
      "Who haven't you met yet that you should?",
      'What is still unclear about how we work?',
    ],
  },
  {
    key: 'feedback-both-ways',
    name: 'Feedback both ways',
    suggestedWhen: 'Suggested once a month',
    questions: [
      "What's one thing I could do better as your lead?",
      "One thing I've seen you do well…",
      'What feedback have others given you lately?',
    ],
  },
  {
    key: 'stay-conversation',
    name: 'Stay conversation',
    suggestedWhen: 'Once a year, or when someone goes quiet',
    questions: [
      'What keeps you here?',
      'What might make you leave?',
      'What would you change about your job?',
    ],
  },
  {
    key: 'back-from-leave',
    name: 'Back from leave',
    suggestedWhen: 'After two weeks or more away',
    questions: [
      'How are you settling back in?',
      'What changed while you were away that you need to know?',
    ],
  },
];

/** The template a 1:1 starts from when its Lead picks none. */
export const DEFAULT_THRIVE_TEMPLATE_KEY = 'weekly-check-in';

/** One of Thrive's own templates, found by its key. */
export class ThriveTemplate {
  private constructor(private readonly details: ThriveTemplateDetails) {}

  static all(): readonly ThriveTemplate[] {
    return THRIVE_TEMPLATES.map((details) => new ThriveTemplate(details));
  }

  static isKey(key: string): boolean {
    return THRIVE_TEMPLATES.some((template) => template.key === key);
  }

  static of(key: string): ThriveTemplate {
    const details = THRIVE_TEMPLATES.find((template) => template.key === key);
    if (!details) {
      throw new OneOnOneTemplateUnknownError();
    }
    return new ThriveTemplate(details);
  }

  snapshot(): ThriveTemplateDetails {
    return this.details;
  }
}
