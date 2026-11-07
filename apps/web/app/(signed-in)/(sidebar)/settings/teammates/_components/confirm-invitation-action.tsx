import { useTransition } from 'react';
import { toast } from 'sonner';
import type { InvitationActionResult } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitation-actions.service';
import { Button, type ButtonProps } from '@/components/atoms/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';

export type ConfirmInvitationActionProps = {
  /** The word that confirms, such as Resend. */
  label: string;
  question: string;
  explanation: string;
  /** The answer that closes the dialog having done nothing. */
  cancelLabel: string;
  /** The toast once it is done. */
  doneMessage: string;
  confirmVariant: ButtonProps['variant'];
  onConfirm: () => Promise<InvitationActionResult>;
  /** Opened from the Invitation's menu, which holds whether it is open. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Where focus goes back to once it closes, when it was opened from a menu whose item is gone by
   * then: the menu's own button. Without it, focus would fall to the page.
   */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
};

/**
 * Asks before acting on an Invitation, because each action reaches the person it was sent to.
 * It is the shared `Dialog`, so the page dims behind it as it does behind every other question.
 * The dialog stays open while the action is in flight, so it cannot be sent twice, and closes
 * once it has answered; the answer is a toast. Focus stays inside it and goes back to the menu's
 * button.
 */
export function ConfirmInvitationAction({
  label,
  question,
  explanation,
  cancelLabel,
  doneMessage,
  confirmVariant,
  onConfirm,
  open,
  onOpenChange,
  returnFocusTo,
}: ConfirmInvitationActionProps) {
  const [isActing, startActing] = useTransition();

  function handleConfirm() {
    startActing(async () => {
      const result = await onConfirm();
      onOpenChange(false);
      if (result.ok) {
        toast.success(doneMessage);
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
          <DialogTitle>{question}</DialogTitle>
          <DialogDescription className="break-all">
            {explanation}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={isActing}>{cancelLabel}</Button>
          </DialogClose>
          <Button
            variant={confirmVariant}
            loading={isActing}
            onClick={handleConfirm}
          >
            {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
