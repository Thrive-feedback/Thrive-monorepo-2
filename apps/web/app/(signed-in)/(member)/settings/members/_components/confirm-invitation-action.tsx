import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { InvitationActionResult } from '@/app/(signed-in)/(member)/settings/members/_lib/invitation-actions.service';
import { Button, type ButtonProps } from '@/components/atoms/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';

export type ConfirmInvitationActionProps = {
  /** The button's visible word, which also confirms in the dialog. */
  label: string;
  /** Names the button for a screen reader, with the address it acts on. */
  accessibleName: string;
  question: string;
  explanation: string;
  /** The answer that closes the dialog having done nothing. */
  cancelLabel: string;
  /** The toast once it is done. */
  doneMessage: string;
  triggerVariant: ButtonProps['variant'];
  confirmVariant: ButtonProps['variant'];
  onConfirm: () => Promise<InvitationActionResult>;
};

/**
 * Asks before acting on an Invitation, because each action reaches the person it was sent to.
 * It is the shared `Dialog`, so the page dims behind it as it does behind every other question.
 * The dialog stays open while the action is in flight, so it cannot be sent twice, and closes
 * once it has answered; the answer is a toast. Focus stays inside it and goes back to the button.
 */
export function ConfirmInvitationAction({
  label,
  accessibleName,
  question,
  explanation,
  cancelLabel,
  doneMessage,
  triggerVariant,
  confirmVariant,
  onConfirm,
}: ConfirmInvitationActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActing, startActing] = useTransition();

  function handleConfirm() {
    startActing(async () => {
      const result = await onConfirm();
      setIsOpen(false);
      if (result.ok) {
        toast.success(doneMessage);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm" aria-label={accessibleName}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent hasCloseButton={false}>
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
