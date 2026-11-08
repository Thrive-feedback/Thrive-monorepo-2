'use client';

import { BellIcon } from 'lucide-react';
import { useState } from 'react';
import { SAMPLE_NOTIFICATIONS } from '@/app/ui-showcase/notifications/_lib/notification-kinds.constant';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { NotificationRow } from '@/components/organisms/notification-row';
import type { BellNotification } from '@/lib/notifications/notification.type';

/**
 * The bell's panel on sample lines, drawn by the real row. It reads and marks nothing on the
 * server: read and unread are kept here, so pressing a line or marking all of them shows what the
 * bell does without an Account behind it.
 */
export function SampleBell() {
  const [notifications, setNotifications] =
    useState<readonly BellNotification[]>(SAMPLE_NOTIFICATIONS);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  function handleOpen(opened: BellNotification) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === opened.id ? { ...item, isRead: true } : item,
      ),
    );
  }

  function handleMarkAllRead() {
    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true })),
    );
  }

  function handleReset() {
    setNotifications(SAMPLE_NOTIFICATIONS);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outlined">
            <BellIcon aria-hidden="true" className="size-4" />
            Open the sample bell, {unreadCount} unread
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-88">
          <div className="flex items-center justify-between gap-2">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <DropdownMenuItem
                className="w-auto px-2 py-1 text-fg-accent"
                onSelect={(event) => {
                  event.preventDefault();
                  handleMarkAllRead();
                }}
              >
                Mark all as read
              </DropdownMenuItem>
            )}
          </div>
          <DropdownMenuSeparator />
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onOpen={handleOpen}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" onClick={handleReset}>
        Make them unread again
      </Button>
    </div>
  );
}
