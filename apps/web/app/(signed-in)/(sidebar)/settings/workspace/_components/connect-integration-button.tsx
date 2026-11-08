'use client';

import { useBeginInNewTab } from '@/app/(signed-in)/(sidebar)/settings/_lib/use-begin-in-new-tab';
import { beginInstall } from '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/integration-actions.service';
import { Button } from '@/components/atoms/button';

export type ConnectIntegrationButtonProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen, which also names the button for a screen reader. */
  label: string;
};

/**
 * Connects a chat tool for the first time, in a tab of its own. Once one is connected, changing
 * it is in the row's menu.
 */
export function ConnectIntegrationButton({
  segment,
  label,
}: ConnectIntegrationButtonProps) {
  const { isLeaving, begin } = useBeginInNewTab(() => beginInstall(segment));

  return (
    <Button
      variant="outlined"
      size="sm"
      disabled={isLeaving}
      aria-label={`Connect ${label}`}
      onClick={begin}
    >
      Connect
    </Button>
  );
}
