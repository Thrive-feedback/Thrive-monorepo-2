import type {
  OneOnOneTemplateNameRow,
  OneOnOneTemplateRow,
} from '../types/one-on-one-template.types';

export abstract class OneOnOneTemplateQuery {
  /**
   * The kept templates one Member sees in a Workspace, none removed: the Workspace's, then their
   * own, each by name. Another Member's own are never answered.
   */
  abstract listSeenBy(
    workspaceId: string,
    accountId: string,
  ): Promise<readonly OneOnOneTemplateRow[]>;

  /**
   * What the kept templates with these ids are called, removed ones too, in one read: the templates
   * an agenda's topics came from, to name them. An id not kept in this Workspace is left out.
   */
  abstract namesOf(
    workspaceId: string,
    templateIds: readonly string[],
  ): Promise<readonly OneOnOneTemplateNameRow[]>;
}
