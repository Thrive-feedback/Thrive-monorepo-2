import { Injectable } from '@nestjs/common';
import { mayStartFromTemplate } from '../../domain/entity/one-on-one-template.entity';
import { OneOnOneTemplateUnknownError } from '../../domain/one-on-one.errors';
import { OneOnOneTemplateRepository } from '../../domain/repository/one-on-one-template-repository.port';
import { templateRefOf } from '../../domain/value-object/one-on-one-template-ref.vo';
import { ThriveTemplate } from '../../domain/value-object/thrive-template.vo';

/**
 * Every template a 1:1 can start from, in one place: Thrive's own, named by key, and the ones a
 * Workspace or a Member keeps, named by id (ADR 0096). A schedule holds the reference, so this is how
 * a 1:1 learns whether the template it was given may be chosen, and which questions its next agenda
 * opens with.
 */
@Injectable()
export class OneOnOneTemplateCatalogService {
  constructor(
    private readonly templateRepository: OneOnOneTemplateRepository,
  ) {}

  /**
   * Refuses a template somebody may not start a 1:1 from (`mayStartFromTemplate`): one that is no
   * template, not kept in this Workspace, another Member's own, or removed — unless it is the one
   * the 1:1 already starts from, `keeping`.
   *
   * It reads outside the template's layer lock, so a template removed at the very moment it is
   * chosen may still be chosen. That is harmless: a removed template keeps answering its questions,
   * and the foreign key means it is never gone.
   */
  async assertChoosable(
    workspaceId: string,
    accountId: string,
    templateKey: string,
    keeping: string | null = null,
  ): Promise<void> {
    const ref = templateRefOf(templateKey);
    const template =
      ref.kind === 'KEPT'
        ? await this.templateRepository.findById(workspaceId, ref.id)
        : null;
    if (
      !mayStartFromTemplate({
        ref,
        kept: template,
        accountId,
        keeping: keeping === null ? null : templateRefOf(keeping),
      })
    ) {
      throw new OneOnOneTemplateUnknownError();
    }
  }

  /**
   * The questions an agenda starting from this template opens with. A removed template still
   * answers, so the 1:1s starting from it keep their questions. A kept one that is not there is a
   * broken reference, which the foreign key forbids, so it is said loudly.
   */
  async questionsOf(
    workspaceId: string,
    templateKey: string,
  ): Promise<readonly string[]> {
    const ref = templateRefOf(templateKey);
    if (ref.kind === 'THRIVE') {
      return ThriveTemplate.of(ref.key).snapshot().questions;
    }
    const template = await this.templateRepository.findById(
      workspaceId,
      ref.id,
    );
    if (!template) {
      throw new Error(
        `A 1:1 starts from template ${ref.id}, which this Workspace does not keep.`,
      );
    }
    return template.snapshot().questions;
  }
}
