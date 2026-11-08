'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { disconnectIntegration } from '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/integration-actions.service';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';

export type DisconnectIntegrationDialogProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen. */
  label: string;
  /** The channel it posts in today, so the question names what is about to stop. */
  channelName: string;
  /** Opened from the row's menu, which holds whether it is open. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The menu's own button, since the item that opened it is gone by the time it closes. */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
};

/**
 * Asks before disconnecting, because it takes something away from everybody rather than from the
 * Admin pressing it: the channel stops hearing about Feedback, **and** every Member who linked
 * their own account quietly stops being messaged, since a chat tool only lets Thrive write to
 * somebody it shares a space with. The dialog says so, because nothing else will.
 *
 * It stays open while the work is in flight, so it cannot be sent twice, and the answer is a
 * toast.
 */
export function DisconnectIntegrationDialog({
  segment,
  label,
  channelName,
  open,
  onOpenChange,
  returnFocusTo,
}: DisconnectIntegrationDialogProps) {
  const [isDisconnecting, startDisconnecting] = useTransition();

  function disconnect() {
    startDisconnecting(async () => {
      const result = await disconnectIntegration(segment);
      onOpenChange(false);
      if (result.ok) {
        toast.success(`${label} is disconnected`);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hasCloseButton={false}
        onCloseAutoFocus={(event) => {
          if (returnFocusTo?.current) {
            event.preventDefault();
            returnFocusTo.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Disconnect {label}?</DialogTitle>
          <DialogDescription>
            #{channelName} will stop hearing about Feedback, and everyone who
            linked their own {label} account will stop being messaged by Thrive
            — {label} only lets Thrive message people it shares a server with.
            Connecting again means authorising Thrive in {label} from the start.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={isDisconnecting}>Stay connected</Button>
          </DialogClose>
          <Button
            variant="danger"
            loading={isDisconnecting}
            onClick={disconnect}
          >
            Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
