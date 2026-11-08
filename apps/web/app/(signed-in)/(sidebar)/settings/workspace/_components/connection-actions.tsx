'use client';

import {
  EllipsisIcon,
  InfoIcon,
  RefreshCwIcon,
  UnplugIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { DetailsDialog } from '@/app/(signed-in)/(sidebar)/settings/_components/details-dialog';
import { useBeginInNewTab } from '@/app/(signed-in)/(sidebar)/settings/_lib/use-begin-in-new-tab';
import type { WorkspaceConnection } from '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/connection.type';
import { beginInstall } from '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/integration-actions.service';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { calendarDay } from '@/lib/calendar-day.util';
import { DisconnectIntegrationDialog } from './disconnect-integration-dialog';

export type ConnectionActionsProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen, which names the menu. */
  label: string;
  connection: WorkspaceConnection;
  /** An Admin, who can change or disconnect it; anyone else can only read where it posts. */
  mayManage: boolean;
};

/**
 * A connected chat tool's menu, so its row can say only that it is connected. Information shows
 * where Thrive posts and who connected it, for every Member, since the channel's name is no secret
 * and seeing it is the honest half of who the posts reach. An Admin also gets Change, which sends
 * them to the tool to pick another server or channel, and Disconnect, in red, which asks first.
 */
export function ConnectionActions({
  segment,
  label,
  connection,
  mayManage,
}: ConnectionActionsProps) {
  const [question, setQuestion] = useState<'details' | 'disconnect'>();
  const closeQuestion = (open: boolean) => !open && setQuestion(undefined);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { isLeaving, begin } = useBeginInNewTab(() => beginInstall(segment));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            aria-label={`Manage ${label} connection`}
          >
            <EllipsisIcon aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setQuestion('details')}>
            <InfoIcon aria-hidden="true" className="size-4" />
            Information
          </DropdownMenuItem>
          {mayManage && (
            <>
              <DropdownMenuItem disabled={isLeaving} onSelect={begin}>
                <RefreshCwIcon aria-hidden="true" className="size-4" />
                Change
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                tone="danger"
                onSelect={() => setQuestion('disconnect')}
              >
                <UnplugIcon aria-hidden="true" className="size-4" />
                Disconnect
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DetailsDialog
        title={label}
        description="Where Thrive posts Kudos, and Feedback shared with everyone in the Workspace."
        rows={[
          { label: 'Channel', value: `#${connection.channelName}` },
          { label: 'Server', value: connection.spaceName },
          { label: 'Connected by', value: connection.connectedBy },
          {
            label: 'Connected',
            value: (
              <time dateTime={connection.connectedAt}>
                {calendarDay(connection.connectedAt)}
              </time>
            ),
          },
        ]}
        open={question === 'details'}
        onOpenChange={closeQuestion}
        returnFocusTo={menuButtonRef}
      />
      {mayManage && (
        <DisconnectIntegrationDialog
          segment={segment}
          label={label}
          channelName={connection.channelName}
          open={question === 'disconnect'}
          onOpenChange={closeQuestion}
          returnFocusTo={menuButtonRef}
        />
      )}
    </>
  );
}
