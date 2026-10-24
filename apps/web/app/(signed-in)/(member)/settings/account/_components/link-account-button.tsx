'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { beginAccountLink } from '@/app/(signed-in)/(member)/settings/account/_lib/account-link-actions.service';
import { Button } from '@/components/atoms/button';

export type LinkAccountButtonProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen, which also names the button for a screen reader. */
  label: string;
  /** Already linked, so this replaces the account rather than adding one. */
  isLinked?: boolean;
};

/**
 * Sends a Member to the chat tool to prove which account there is theirs. The tool decides what
 * happens next, so this button's own job ends at leaving — it only speaks up when Thrive could
 * not even say where to go.
 */
export function LinkAccountButton({
  segment,
  label,
  isLinked = false,
}: LinkAccountButtonProps) {
  const [isLeaving, startLeaving] = useTransition();

  function link() {
    startLeaving(async () => {
      // Answers only on failure: a success has already navigated away from this page.
      const result = await beginAccountLink(segment);
      toast.error(result.message);
    });
  }

  return (
    <Button
      variant={isLinked ? 'ghost' : 'primary'}
      disabled={isLeaving}
      aria-label={isLinked ? `Change ${label} account` : `Link ${label}`}
      onClick={link}
    >
      {isLinked ? 'Change' : `Link ${label}`}
    </Button>
  );
}
