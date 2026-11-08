'use client';

import { useBeginInNewTab } from '@/app/(signed-in)/(sidebar)/settings/_lib/use-begin-in-new-tab';
import { beginAccountLink } from '@/app/(signed-in)/(sidebar)/settings/account/_lib/account-link-actions.service';
import { Button } from '@/components/atoms/button';

export type LinkAccountButtonProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen, which names the button for a screen reader. */
  label: string;
};

/**
 * Links a chat account for the first time, in a tab of its own. The row already names the tool, so
 * the button says only Link; its accessible name keeps the tool. Once one is linked, changing it
 * is in the row's menu.
 */
export function LinkAccountButton({ segment, label }: LinkAccountButtonProps) {
  const { isLeaving, begin } = useBeginInNewTab(() =>
    beginAccountLink(segment),
  );

  return (
    <Button
      variant="outlined"
      size="sm"
      disabled={isLeaving}
      aria-label={`Link ${label}`}
      onClick={begin}
    >
      Link
    </Button>
  );
}
