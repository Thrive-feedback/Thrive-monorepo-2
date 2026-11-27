import type { OneOnOneTemplate } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';

/** The API's limits on a kept template, so the form says them before anything is sent. */
export const MAX_TEMPLATE_NAME_LENGTH = 60;
export const MAX_TEMPLATE_SUGGESTED_WHEN_LENGTH = 120;
export const MAX_TEMPLATE_QUESTION_LENGTH = 200;
export const MAX_TEMPLATE_QUESTIONS = 12;

/** A template as it is being written: its name, when to use it, and its questions in order. */
export type TemplateDraft = {
  readonly name: string;
  readonly suggestedWhen: string;
  readonly questions: readonly string[];
};

/** A new template starts with one question to write. */
export const EMPTY_DRAFT: TemplateDraft = {
  name: '',
  suggestedWhen: '',
  questions: [],
};

/** What a template says, as a draft to rewrite. */
export function draftOf(template: OneOnOneTemplate): TemplateDraft {
  return {
    name: template.name,
    suggestedWhen: template.suggestedWhen,
    questions: template.questions,
  };
}

/**
 * A copy of a template, to make one's own from: Thrive's keep their names, since a copy sits in
 * another layer; one copied within its own layer is told apart as a copy.
 */
export function copyOf(
  template: OneOnOneTemplate,
  { sameLayer }: { readonly sameLayer: boolean },
): TemplateDraft {
  const name = sameLayer
    ? `${template.name} (copy)`.slice(0, MAX_TEMPLATE_NAME_LENGTH)
    : template.name;
  return { ...draftOf(template), name };
}

/** Whether a draft says enough to keep: a name and one question that is not blank. */
export function isKeepable(draft: TemplateDraft): boolean {
  return (
    draft.name.trim() !== '' &&
    draft.questions.some((question) => question.trim() !== '')
  );
}
