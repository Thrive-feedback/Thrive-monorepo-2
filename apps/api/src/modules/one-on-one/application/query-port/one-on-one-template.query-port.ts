import type { OneOnOneTemplateRow } from '../types/one-on-one-template.types';

export abstract class OneOnOneTemplateQuery {
  /**
   * The kept templates one Member sees in a Workspace, none removed: the Workspace's, then their
   * own, each by name. Another Member's own are never answered.
   */
  abstract listSeenBy(
    workspaceId: string,
    accountId: string,
  ): Promise<readonly OneOnOneTemplateRow[]>;
}
