import { OneOnOneTemplateUnknownError } from '../one-on-one.errors';
import { ThriveTemplate } from './thrive-template.vo';

/** A kept template's id: a UUID, which no Thrive key is shaped like. */
const KEPT_TEMPLATE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Which template a 1:1 or a meeting starts from (ADR 0096): one of Thrive's, by its key, or one a
 * Workspace or a Member keeps, by its id. On the wire both travel as one `templateKey`; stored, each
 * has its own column, and a kept one is a foreign key, so it can never point at nothing.
 */
export type OneOnOneTemplateRef =
  | { readonly kind: 'THRIVE'; readonly key: string }
  | { readonly kind: 'KEPT'; readonly id: string };

/**
 * Reads a `templateKey` as somebody sent it: one of Thrive's keys, or a kept template's id. Anything
 * else is no template at all. Whether a kept one exists, and may be chosen, is the catalog's to ask.
 */
export function templateRefOf(templateKey: string): OneOnOneTemplateRef {
  if (ThriveTemplate.isKey(templateKey)) {
    return { kind: 'THRIVE', key: templateKey };
  }
  if (KEPT_TEMPLATE_ID.test(templateKey)) {
    return { kind: 'KEPT', id: templateKey.toLowerCase() };
  }
  throw new OneOnOneTemplateUnknownError();
}

/**
 * Rebuilds a stored reference from its two columns, exactly one of which is set, the key one of
 * Thrive's; anything else is a broken row, said loudly rather than read as some template.
 */
export function storedTemplateRef(columns: {
  readonly templateKey: string | null;
  readonly templateId: string | null;
}): OneOnOneTemplateRef {
  const { templateKey, templateId } = columns;
  if (
    templateKey !== null &&
    templateId === null &&
    ThriveTemplate.isKey(templateKey)
  ) {
    return { kind: 'THRIVE', key: templateKey };
  }
  if (templateId !== null && templateKey === null) {
    return { kind: 'KEPT', id: templateId };
  }
  throw new Error(
    'A stored 1:1 names its template by both a Thrive key and a kept id, by neither, or by a key Thrive does not have.',
  );
}

/** The reference as the wire carries it: the Thrive key, or the kept id. */
export function templateKeyOf(ref: OneOnOneTemplateRef): string {
  return ref.kind === 'THRIVE' ? ref.key : ref.id;
}

/** The reference as it is stored: the Thrive key column, or the kept id column. */
export function templateColumnsOf(ref: OneOnOneTemplateRef): {
  readonly templateKey: string | null;
  readonly templateId: string | null;
} {
  return ref.kind === 'THRIVE'
    ? { templateKey: ref.key, templateId: null }
    : { templateKey: null, templateId: ref.id };
}
