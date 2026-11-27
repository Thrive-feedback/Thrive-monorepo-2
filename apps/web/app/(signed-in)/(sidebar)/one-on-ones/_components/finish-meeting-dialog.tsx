'use client';

import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/_lib/use-one-on-one-action';
import { MeetingSummary } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/meeting-summary';
import type { Meeting } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import { finishMeeting } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';

export type FinishMeetingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  oneOnOneId: string;
  meeting: Meeting;
  /**
   * What takes focus back when it closes without finishing: the button that opened it, which it
   * opens after saving and reading again rather than as a trigger. Gone after a finish, focus is then
   * the panel's to place.
   */
  returnFocusTo?: () => HTMLElement | null;
};

/**
 * Finishing a meeting: its summary to check — what was talked about, with the notes, and what
 * carries over — then one press shares it with both and closes the meeting for good.
 */
export function FinishMeetingDialog({
  open,
  onOpenChange,
  workspaceId,
  oneOnOneId,
  meeting,
  returnFocusTo,
}: FinishMeetingDialogProps) {
  const { isPending, run } = useOneOnOneAction();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-5"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const opener = returnFocusTo?.();
          if (opener?.isConnected) {
            opener.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Finish this meeting?</DialogTitle>
          <DialogDescription>
            You’ll both find this summary in Past meetings.
          </DialogDescription>
        </DialogHeader>
        <MeetingSummary meeting={meeting} />
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Keep going
          </Button>
          <Button
            variant="primary"
            loading={isPending}
            onClick={() =>
              run(() => finishMeeting(workspaceId, oneOnOneId, meeting.id), {
                done: 'Meeting finished and shared',
                onSuccess: () => onOpenChange(false),
              })
            }
          >
            Finish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
