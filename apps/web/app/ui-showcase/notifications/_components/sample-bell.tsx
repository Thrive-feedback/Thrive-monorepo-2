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
import { LandingPreview } from './landing-preview';

/**
 * The bell's panel on sample lines, drawn by the real row. It reads and marks nothing on the
 * server: read and unread are kept here, so pressing a line or marking all of them shows what the
 * bell does without an Account behind it. A pressed line does not follow its link, which would
 * take a sample id nowhere; the page it would have opened is drawn beside the bell instead.
 */
export function SampleBell() {
  const [notifications, setNotifications] =
    useState<readonly BellNotification[]>(SAMPLE_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);
  const [pressed, setPressed] = useState<BellNotification | null>(null);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  function handleOpen(opened: BellNotification) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === opened.id ? { ...item, isRead: true } : item,
      ),
    );
    setPressed(opened);
    setIsOpen(false);
  }

  /**
   * Stops a line's link before it navigates. The row's link and the menu's own select run in one
   * click handler, so cancelling the click here also cancels the select: the line is marked and
   * the panel closed by hand. The rows are the panel's only links, in the order they are drawn.
   */
  function handleClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target;
    const link = target instanceof Element ? target.closest('a[href]') : null;
    if (link === null) {
      return;
    }
    const links = Array.from(event.currentTarget.querySelectorAll('a[href]'));
    const opened = notifications[links.indexOf(link)];
    if (opened === undefined) {
      return;
    }
    event.preventDefault();
    handleOpen(opened);
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outlined">
              <BellIcon aria-hidden="true" className="size-4" />
              Open the sample bell, {unreadCount} unread
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-88"
            onClickCapture={handleClickCapture}
          >
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
      <LandingPreview notification={pressed} />
    </div>
  );
}
