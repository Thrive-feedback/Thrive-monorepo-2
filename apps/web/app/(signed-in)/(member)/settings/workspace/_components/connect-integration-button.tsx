'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { beginInstall } from '@/app/(signed-in)/(member)/settings/workspace/_lib/integration-actions.service';
import { Button } from '@/components/atoms/button';

export type ConnectIntegrationButtonProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen, which also names the button for a screen reader. */
  label: string;
  /** Already connected, so this changes the server or channel rather than adding one. */
  isConnected?: boolean;
};

/**
 * Sends an Admin to the chat tool to authorise Thrive. The tool decides what happens next, so
 * this button's own job ends at leaving — it only speaks up when Thrive could not even say
 * where to go.
 */
export function ConnectIntegrationButton({
  segment,
  label,
  isConnected = false,
}: ConnectIntegrationButtonProps) {
  const [isLeaving, startLeaving] = useTransition();

  function connect() {
    startLeaving(async () => {
      // Answers only on failure: a success has already navigated away from this page.
      const result = await beginInstall(segment);
      toast.error(result.message);
    });
  }

  return (
    <Button
      variant={isConnected ? 'ghost' : 'primary'}
      disabled={isLeaving}
      aria-label={
        isConnected ? `Change ${label} connection` : `Connect ${label}`
      }
      onClick={connect}
    >
      {isConnected ? 'Change' : 'Connect'}
    </Button>
  );
}
