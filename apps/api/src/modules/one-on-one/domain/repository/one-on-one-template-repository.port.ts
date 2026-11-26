import type {
  OneOnOneTemplate,
  OneOnOneTemplateScope,
} from '../entity/one-on-one-template.entity';

/** One layer of kept templates: the Workspace's, or one Member's own. */
export interface OneOnOneTemplateLayer {
  readonly scope: OneOnOneTemplateScope;
  /** Whose layer, for one Member's own; `null` for the Workspace's. */
  readonly ownerAccountId: string | null;
}

export abstract class OneOnOneTemplateRepository {
  /**
   * `null` when there is none with this id in this Workspace — another's is never found. A removed
   * one is found, so the 1:1s starting from it still read its questions.
   */
  abstract findById(
    workspaceId: string,
    templateId: string,
  ): Promise<OneOnOneTemplate | null>;

  /** The templates one layer keeps and has not removed, so a new name and the limit can be checked. */
  abstract keptIn(
    workspaceId: string,
    layer: OneOnOneTemplateLayer,
  ): Promise<readonly OneOnOneTemplate[]>;

  /** Stores a new one, or what changed in one. */
  abstract save(template: OneOnOneTemplate): Promise<void>;
}
