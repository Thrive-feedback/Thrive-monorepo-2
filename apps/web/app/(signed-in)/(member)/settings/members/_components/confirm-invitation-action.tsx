import { AlertDialog } from 'radix-ui';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { InvitationActionResult } from '@/app/(signed-in)/(member)/settings/members/_lib/invitation-actions.service';
import { Button, type ButtonProps } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

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
 * The dialog stays open while the action is in flight, so it cannot be sent twice, and closes
 * once it has answered; the answer is a toast. Radix keeps focus inside the dialog and hands it
 * back to the button.
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
    <AlertDialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialog.Trigger asChild>
        <Button variant={triggerVariant} size="sm" aria-label={accessibleName}>
          {label}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0" />
        <AlertDialog.Content className="fixed inset-x-4 top-1/2 mx-auto flex max-w-2xl -translate-y-1/2 flex-col gap-4 rounded-page border border-border-default bg-surface-overlay p-6 shadow-high">
          <AlertDialog.Title asChild>
            <Text as="h2" variant="subtitle-2">
              {question}
            </Text>
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <Text variant="body-2" tone="muted" className="break-all">
              {explanation}
            </Text>
          </AlertDialog.Description>
          <div className="flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button disabled={isActing}>{cancelLabel}</Button>
            </AlertDialog.Cancel>
            <Button
              variant={confirmVariant}
              loading={isActing}
              onClick={handleConfirm}
            >
              {label}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
