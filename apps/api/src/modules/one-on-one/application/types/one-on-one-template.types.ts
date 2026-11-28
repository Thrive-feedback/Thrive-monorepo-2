import type { OneOnOneTemplateScope } from '../../domain/entity/one-on-one-template.entity';

/** One kept template, as stored, for a Member who sees it. */
export interface OneOnOneTemplateRow {
  readonly id: string;
  readonly scope: OneOnOneTemplateScope;
  /** Whose it is, for one of a Member's own; `null` for the Workspace's. */
  readonly ownerAccountId: string | null;
  readonly name: string;
  readonly suggestedWhen: string;
  readonly questions: readonly string[];
}

/** A kept template's name, by its id. */
export interface OneOnOneTemplateNameRow {
  readonly id: string;
  readonly name: string;
}

/** What somebody writes for a template: its name, when to use it, and its questions. */
export interface OneOnOneTemplateContentInput {
  readonly name: string;
  readonly suggestedWhen?: string;
  readonly questions: readonly string[];
}

/** Any template a 1:1 can start from, as the person listing them sees it. */
export interface OneOnOneTemplateView {
  /** How a schedule names it: a Thrive template's key, or a kept one's id. */
  readonly key: string;
  readonly scope: 'THRIVE' | OneOnOneTemplateScope;
  readonly name: string;
  readonly suggestedWhen: string;
  readonly questions: readonly string[];
  /** Whether the person listing may change or remove it: never Thrive's own. */
  readonly changeable: boolean;
}

export interface OneOnOneTemplateList {
  readonly items: readonly OneOnOneTemplateView[];
  /** Whether the person listing may keep templates for the whole Workspace: an Admin. */
  readonly mayKeepForWorkspace: boolean;
}
