import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

/** Where to send the person, or why not. */
export type BeginResult =
  | { readonly ok: true; readonly authorizeUrl: string }
  | { readonly ok: false; readonly message: string };

/**
 * Sends the person to a chat tool in a tab of its own, so Thrive stays open where it was: linking
 * their account, or connecting the Workspace. `start` asks Thrive where to go.
 *
 * The tab is opened on the press itself, before anything is awaited, because a browser blocks a
 * tab opened once a press has passed; it is filled once the address arrives, and closed again if
 * Thrive could not say where to go. Should the browser block it anyway, this tab goes instead, as
 * it always did. When this tab is looked at again, it reads afresh, so what was linked or
 * connected in the other shows here without a reload.
 */
export function useBeginInNewTab(start: () => Promise<BeginResult>) {
  const router = useRouter();
  const [isLeaving, startLeaving] = useTransition();

  function begin() {
    const tab = window.open('', '_blank');
    if (tab) {
      // The chat tool's page must not be able to reach back into Thrive through its opener.
      tab.opener = null;
    }
    startLeaving(async () => {
      const result = await start();
      if (!result.ok) {
        tab?.close();
        toast.error(result.message);
        return;
      }
      if (!tab) {
        router.push(result.authorizeUrl);
        return;
      }
      tab.location.replace(result.authorizeUrl);
      window.addEventListener('focus', () => router.refresh(), { once: true });
    });
  }

  return { isLeaving, begin };
}
