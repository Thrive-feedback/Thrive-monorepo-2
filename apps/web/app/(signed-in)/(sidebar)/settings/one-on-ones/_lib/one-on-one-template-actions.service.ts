'use server';

import { unwrap } from '@repo/api';
import { z } from 'zod';
import type {
  OneOnOneActionResult,
  OneOnOneTemplateScope,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  act,
  COULD_NOT,
  REFUSALS,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one-act.service';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import {
  MAX_TEMPLATE_NAME_LENGTH,
  MAX_TEMPLATE_QUESTION_LENGTH,
  MAX_TEMPLATE_QUESTIONS,
  MAX_TEMPLATE_SUGGESTED_WHEN_LENGTH,
  type TemplateDraft,
} from './one-on-one-template.util';

const Id = z.uuid();
const Scope = z.enum(['PERSONAL', 'WORKSPACE']);
const Draft = z.object({
  name: z.string().max(MAX_TEMPLATE_NAME_LENGTH),
  suggestedWhen: z.string().max(MAX_TEMPLATE_SUGGESTED_WHEN_LENGTH),
  questions: z
    .array(z.string().max(MAX_TEMPLATE_QUESTION_LENGTH))
    .max(MAX_TEMPLATE_QUESTIONS),
});

/** A template changing is read again where it is kept, and on the 1:1s page, whose picker lists it. */
const PATHS = [ROUTES.settings.oneOnOnes, ROUTES.oneOnOnes];

/**
 * What was written, trimmed, with blank questions left out; `null` when it is not a template yet,
 * or says more than a template may.
 */
function written(draft: TemplateDraft) {
  const parsed = Draft.safeParse(draft);
  if (!parsed.success) {
    return null;
  }
  const questions = parsed.data.questions
    .map((question) => question.trim())
    .filter((question) => question !== '');
  const name = parsed.data.name.trim();
  if (name === '' || questions.length === 0) {
    return null;
  }
  return { name, suggestedWhen: parsed.data.suggestedWhen.trim(), questions };
}

const NOT_A_TEMPLATE =
  REFUSALS.ONE_ON_ONE_TEMPLATE_INVALID ?? "That can't be kept as a template.";

/**
 * Keeps a new template: the person's own, or, for an Admin, one for everyone in the Workspace.
 * Copying one of Thrive's, or another layer's, is the same call with what was copied.
 */
export async function keepOneOnOneTemplate(
  workspaceId: string,
  scope: Exclude<OneOnOneTemplateScope, 'THRIVE'>,
  draft: TemplateDraft,
): Promise<OneOnOneActionResult> {
  const forWhom = Scope.safeParse(scope);
  const body = written(draft);
  if (!forWhom.success) {
    return { ok: false, message: COULD_NOT };
  }
  if (body === null) {
    return { ok: false, message: NOT_A_TEMPLATE };
  }
  return act(
    workspaceId,
    async (path, cookie) => {
      const kept = unwrap(
        await apiClient().POST(
          '/v1/workspaces/{workspaceId}/one-on-one-templates',
          {
            params: { path, header: { cookie } },
            body: { scope: forWhom.data, ...body },
          },
        ),
      );
      return kept.id;
    },
    { paths: PATHS },
  );
}

/** Rewrites a template the person may change; agendas opened from it later use what it says now. */
export async function rewriteOneOnOneTemplate(
  workspaceId: string,
  templateId: string,
  draft: TemplateDraft,
): Promise<OneOnOneActionResult> {
  const id = Id.safeParse(templateId);
  const body = written(draft);
  if (!id.success) {
    return { ok: false, message: COULD_NOT };
  }
  if (body === null) {
    return { ok: false, message: NOT_A_TEMPLATE };
  }
  return act(
    workspaceId,
    async (path, cookie) => {
      // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
      await apiClient().PUT(
        '/v1/workspaces/{workspaceId}/one-on-one-templates/{templateId}',
        {
          params: {
            path: { ...path, templateId: id.data },
            header: { cookie },
          },
          body,
        },
      );
      return undefined;
    },
    { paths: PATHS },
  );
}

/** Removes a template the person may change; the 1:1s starting from it keep its questions. */
export async function removeOneOnOneTemplate(
  workspaceId: string,
  templateId: string,
): Promise<OneOnOneActionResult> {
  const id = Id.safeParse(templateId);
  if (!id.success) {
    return { ok: false, message: COULD_NOT };
  }
  return act(
    workspaceId,
    async (path, cookie) => {
      await apiClient().DELETE(
        '/v1/workspaces/{workspaceId}/one-on-one-templates/{templateId}',
        {
          params: {
            path: { ...path, templateId: id.data },
            header: { cookie },
          },
        },
      );
      return undefined;
    },
    { paths: PATHS },
  );
}
