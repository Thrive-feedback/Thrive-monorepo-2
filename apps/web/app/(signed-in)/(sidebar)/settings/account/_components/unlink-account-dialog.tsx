'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { unlinkAccount } from '@/app/(signed-in)/(sidebar)/settings/account/_lib/account-link-actions.service';
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

export type UnlinkAccountDialogProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen. */
  label: string;
  /** The account linked today, so the question names what is about to be forgotten. */
  externalUsername: string;
  /** Opened from the row's menu, which holds whether it is open. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The menu's own button, since the item that opened it is gone by the time it closes. */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
};

/**
 * Asks before unlinking, and says plainly what stops: linking is the switch, so unlinking is how
 * somebody stops being messaged, and Thrive forgets which account was theirs rather than keeping
 * it marked unused.
 *
 * The dialog stays open while the work is in flight, so it cannot be sent twice, and the answer
 * is a toast.
 */
export function UnlinkAccountDialog({
  segment,
  label,
  externalUsername,
  open,
  onOpenChange,
  returnFocusTo,
}: UnlinkAccountDialogProps) {
  const [isUnlinking, startUnlinking] = useTransition();

  function unlink() {
    startUnlinking(async () => {
      const result = await unlinkAccount(segment);
      onOpenChange(false);
      if (result.ok) {
        toast.success(`${label} is unlinked`);
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
          <DialogTitle>Unlink {label}?</DialogTitle>
          <DialogDescription>
            Thrive will stop messaging you in {label}, and will forget that{' '}
            {externalUsername} is you. Nothing else changes — you keep seeing
            everything inside Thrive. You can link {label} again whenever you
            like.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={isUnlinking}>Stay linked</Button>
          </DialogClose>
          <Button variant="danger" loading={isUnlinking} onClick={unlink}>
            Unlink
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
