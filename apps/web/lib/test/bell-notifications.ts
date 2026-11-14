import { act } from '@testing-library/react';
import { vi } from 'vitest';
import type {
  BellNotification,
  NotificationsPage,
  NotificationType,
} from '@/lib/notifications/notification.type';

/** A time every line in a test was told at, so nothing a test draws depends on the clock. */
const TOLD_AT = '2026-11-14T09:00:00.000Z';

let linesMade = 0;

/** One line of the bell, unread unless told otherwise, with an id no other line in the run has. */
export function aBellNotification(
  type: NotificationType,
  overrides: Partial<BellNotification> = {},
): BellNotification {
  linesMade += 1;
  return {
    id: `0199ffff-0000-7000-8000-${String(linesMade).padStart(12, '0')}`,
    type,
    actorName: 'Nut',
    actorPhotoUrl: null,
    subjectId: '0199ffff-0000-7000-8000-00000000000a',
    createdAt: TOLD_AT,
    isRead: false,
    ...overrides,
  };
}

/** `count` unread lines of one kind. */
export function unreadLines(
  type: NotificationType,
  count: number,
): BellNotification[] {
  return Array.from({ length: count }, () => aBellNotification(type));
}

/** A page of lines as the list action answers it: every line there is, unless `total` says more. */
export function aPage(
  items: readonly BellNotification[],
  total = items.length,
): NotificationsPage {
  return { items, total };
}

/**
 * The bell's server actions, to stand in for their module (FE_14 R6) in any test that draws the
 * bell or a count read from it:
 *
 * ```ts
 * vi.mock('@/lib/notifications/notification-actions.service', async () =>
 *   (await import('@/lib/test/bell-notifications')).BELL_ACTIONS,
 * );
 * ```
 *
 * {@link answerTheBell} sets what they answer; call it in `beforeEach`.
 */
export const BELL_ACTIONS = {
  countUnreadNotifications: vi.fn<() => Promise<number | null>>(),
  listMyNotifications:
    vi.fn<(page?: number) => Promise<NotificationsPage | null>>(),
  markNotificationRead: vi.fn<(id: string) => Promise<void>>(),
  markAllNotificationsRead: vi.fn<() => Promise<boolean>>(),
};

/**
 * Resets the bell's actions so they answer with `lines` as the only page and count its unread
 * ones, marking succeeds, and nothing a previous test asked is remembered.
 */
export function answerTheBell(lines: readonly BellNotification[] = []) {
  BELL_ACTIONS.countUnreadNotifications
    .mockReset()
    .mockResolvedValue(lines.filter((line) => !line.isRead).length);
  BELL_ACTIONS.listMyNotifications.mockReset().mockResolvedValue(aPage(lines));
  BELL_ACTIONS.markNotificationRead.mockReset().mockResolvedValue(undefined);
  BELL_ACTIONS.markAllNotificationsRead.mockReset().mockResolvedValue(true);
}

/**
 * Does `work` — sends an event, gives a held answer — and lets every answer it set off land and
 * render before the test goes on. Waiting for an action to have been *called* only proves the
 * request went out; what a test about a late or failed answer must see is what that answer did.
 */
export async function settled(work: () => void = () => {}) {
  await act(async () => {
    work();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}
