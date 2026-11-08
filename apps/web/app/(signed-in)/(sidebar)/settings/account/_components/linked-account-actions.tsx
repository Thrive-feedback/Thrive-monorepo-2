'use client';

import {
  EllipsisIcon,
  InfoIcon,
  RefreshCwIcon,
  UnlinkIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { DetailsDialog } from '@/app/(signed-in)/(sidebar)/settings/_components/details-dialog';
import { useBeginInNewTab } from '@/app/(signed-in)/(sidebar)/settings/_lib/use-begin-in-new-tab';
import { beginAccountLink } from '@/app/(signed-in)/(sidebar)/settings/account/_lib/account-link-actions.service';
import type { LinkedAccount } from '@/app/(signed-in)/(sidebar)/settings/account/_lib/linked-account.type';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { calendarDay } from '@/lib/calendar-day.util';
import { UnlinkAccountDialog } from './unlink-account-dialog';

export type LinkedAccountActionsProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen, which names the menu. */
  label: string;
  link: LinkedAccount;
};

/**
 * A linked chat account's menu, so its row can say only that it is linked. Information shows which
 * account Thrive has and since when; Change sends the Member to the tool to link another; Unlink,
 * in red, asks first.
 */
export function LinkedAccountActions({
  segment,
  label,
  link,
}: LinkedAccountActionsProps) {
  const [question, setQuestion] = useState<'details' | 'unlink'>();
  const closeQuestion = (open: boolean) => !open && setQuestion(undefined);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { isLeaving, begin } = useBeginInNewTab(() =>
    beginAccountLink(segment),
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            aria-label={`Manage ${label} link`}
          >
            <EllipsisIcon aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setQuestion('details')}>
            <InfoIcon aria-hidden="true" className="size-4" />
            Information
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isLeaving} onSelect={begin}>
            <RefreshCwIcon aria-hidden="true" className="size-4" />
            Change
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            tone="danger"
            onSelect={() => setQuestion('unlink')}
          >
            <UnlinkIcon aria-hidden="true" className="size-4" />
            Unlink
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DetailsDialog
        title={label}
        description={`Thrive sends your direct messages to this account. They reach you once your Workspace has connected ${label}.`}
        rows={[
          { label: 'Account', value: link.externalUsername },
          {
            label: 'Linked',
            value: (
              <time dateTime={link.linkedAt}>{calendarDay(link.linkedAt)}</time>
            ),
          },
        ]}
        open={question === 'details'}
        onOpenChange={closeQuestion}
        returnFocusTo={menuButtonRef}
      />
      <UnlinkAccountDialog
        segment={segment}
        label={label}
        externalUsername={link.externalUsername}
        open={question === 'unlink'}
        onOpenChange={closeQuestion}
        returnFocusTo={menuButtonRef}
      />
    </>
  );
}
