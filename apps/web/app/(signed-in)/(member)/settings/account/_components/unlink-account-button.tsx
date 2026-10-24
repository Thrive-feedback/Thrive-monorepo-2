'use client';

import { AlertDialog } from 'radix-ui';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { unlinkAccount } from '@/app/(signed-in)/(member)/settings/account/_lib/account-link-actions.service';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

export type UnlinkAccountButtonProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen, which also names the button for a screen reader. */
  label: string;
  /** The account linked today, so the question names what is about to be forgotten. */
  externalUsername: string;
};

/**
 * Asks before unlinking, and says plainly what stops: linking is the switch, so unlinking is how
 * somebody stops being messaged, and Thrive forgets which account was theirs rather than keeping
 * it marked unused.
 *
 * The dialog stays open while the work is in flight, so it cannot be sent twice, and the answer
 * is a toast.
 */
export function UnlinkAccountButton({
  segment,
  label,
  externalUsername,
}: UnlinkAccountButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUnlinking, startUnlinking] = useTransition();

  function unlink() {
    startUnlinking(async () => {
      const result = await unlinkAccount(segment);
      setIsOpen(false);
      if (result.ok) {
        toast.success(`${label} is unlinked`);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialog.Trigger asChild>
        <Button variant="ghost-danger" aria-label={`Unlink ${label}`}>
          Unlink
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0" />
        <AlertDialog.Content className="fixed inset-x-4 top-1/2 mx-auto flex max-w-2xl -translate-y-1/2 flex-col gap-4 rounded-page border border-border-default bg-surface-overlay p-6 shadow-high">
          <AlertDialog.Title asChild>
            <Text as="h2" variant="subtitle-2">
              Unlink {label}?
            </Text>
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <Text variant="body-2" tone="muted">
              Thrive will stop messaging you in {label}, and will forget that{' '}
              {externalUsername} is you. Nothing else changes — you keep seeing
              everything inside Thrive. You can link {label} again whenever you
              like.
            </Text>
          </AlertDialog.Description>
          <div className="flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button disabled={isUnlinking}>Stay linked</Button>
            </AlertDialog.Cancel>
            <Button variant="danger" disabled={isUnlinking} onClick={unlink}>
              Unlink
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
