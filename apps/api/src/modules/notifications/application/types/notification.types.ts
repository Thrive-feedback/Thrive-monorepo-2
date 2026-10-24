import type { NotificationTypeValue } from '../../domain/value-object/notification-type.vo';

/** What a collection route asks for. Declared here, not borrowed from another module. */
export interface PageRequest {
  /** 1-based. */
  readonly page: number;
  readonly pageSize: number;
}

/** One Notification as it is stored: ids and a type, with nobody named yet. */
export interface NotificationRow {
  readonly id: string;
  readonly type: NotificationTypeValue;
  readonly actorAccountId: string;
  readonly subjectId: string;
  readonly createdAt: Date;
  /** `null` while the Member has not read it. */
  readonly readAt: Date | null;
}

export interface NotificationRowPage {
  readonly items: readonly NotificationRow[];
  readonly total: number;
}

/** The same Notification once the actor has a name, which is all a bell line needs. */
export interface NotificationView extends NotificationRow {
  /** `null` while the actor has not introduced themselves, or their Account is gone. */
  readonly actorName: string | null;
}

export interface NotificationListView {
  readonly items: readonly NotificationView[];
  readonly total: number;
}
