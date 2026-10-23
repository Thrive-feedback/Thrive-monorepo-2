'use client';

import { AlertDialog } from 'radix-ui';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { disconnectIntegration } from '@/app/(signed-in)/(member)/settings/workspace/_lib/integration-actions.service';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

export type DisconnectIntegrationButtonProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen, which also names the button for a screen reader. */
  label: string;
  /** The channel it posts in today, so the question names what is about to stop. */
  channelName: string;
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
export function DisconnectIntegrationButton({
  segment,
  label,
  channelName,
}: DisconnectIntegrationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDisconnecting, startDisconnecting] = useTransition();

  function disconnect() {
    startDisconnecting(async () => {
      const result = await disconnectIntegration(segment);
      setIsOpen(false);
      if (result.ok) {
        toast.success(`${label} is disconnected`);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialog.Trigger asChild>
        <Button variant="ghost-danger" aria-label={`Disconnect ${label}`}>
          Disconnect
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0" />
        <AlertDialog.Content className="fixed inset-x-4 top-1/2 mx-auto flex max-w-2xl -translate-y-1/2 flex-col gap-4 rounded-page border border-border-default bg-surface-overlay p-6 shadow-high">
          <AlertDialog.Title asChild>
            <Text as="h2" variant="subtitle-2">
              Disconnect {label}?
            </Text>
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <Text variant="body-2" tone="muted">
              #{channelName} will stop hearing about Feedback, and everyone who
              linked their own {label} account will stop being messaged by
              Thrive — {label} only lets Thrive message people it shares a
              server with. Connecting again means authorising Thrive in {label}{' '}
              from the start.
            </Text>
          </AlertDialog.Description>
          <div className="flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button disabled={isDisconnecting}>Stay connected</Button>
            </AlertDialog.Cancel>
            <Button
              variant="danger"
              disabled={isDisconnecting}
              onClick={disconnect}
            >
              Disconnect
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
