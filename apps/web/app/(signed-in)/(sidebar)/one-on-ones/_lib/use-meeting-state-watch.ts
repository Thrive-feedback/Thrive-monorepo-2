import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  checkMeetingState,
  type MeetingState,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service';
import { useIsSampleData } from '@/components/organisms/sample-data-provider';

/** How often the page asks where the meeting stands, while it is in view. */
export const WATCH_EVERY_MS = 10_000;

export type MeetingStateWatch = MeetingState & {
  readonly workspaceId: string;
  readonly oneOnOneId: string;
  /** The other person's first name, for saying who moved it on. */
  readonly otherName: string;
  /** While the person's own write is on its way, the page is about to change anyway: no asking. */
  readonly paused: boolean;
};

/** What changed, in words, or `null` when the page already shows it. */
function changeOf(
  shown: MeetingState,
  now: MeetingState,
  otherName: string,
): string | null {
  if (shown.meetingId === now.meetingId && shown.state === now.state) {
    return null;
  }
  if (now.state === 'IN_PROGRESS' && shown.state !== 'IN_PROGRESS') {
    return `${otherName} started the meeting`;
  }
  if (shown.state === 'IN_PROGRESS' && now.state !== 'IN_PROGRESS') {
    return 'The meeting was finished';
  }
  // Opened, or the agenda changed hands; nothing worth a word, but the page should show it.
  return '';
}

/**
 * Keeps Start and Finish in step between the two people without realtime: while the 1:1 page is in
 * view it asks every ten seconds, and once as it comes back into view, only where the next meeting
 * stands. When the other person has started or finished it, the page reads itself again and says so.
 * Notes are not part of this; they still come with Sync.
 */
export function useMeetingStateWatch({
  workspaceId,
  oneOnOneId,
  meetingId,
  state,
  otherName,
  paused,
}: MeetingStateWatch) {
  const router = useRouter();
  // Sample data, as in the showcase, has no server to ask.
  const isSample = useIsSampleData();
  const shown = useRef<MeetingState>({ meetingId, state });
  shown.current = { meetingId, state };
  const isPaused = useRef(paused);
  isPaused.current = paused;
  /**
   * What the page showed when it last asked to be read again. Until it shows something else, the
   * read is still on its way, so it is not asked for twice.
   */
  const refreshedFrom = useRef<string | null>(null);

  useEffect(() => {
    if (isSample) {
      return;
    }
    let cancelled = false;

    async function check() {
      const showing = `${shown.current.meetingId}:${shown.current.state}`;
      if (
        isPaused.current ||
        refreshedFrom.current === showing ||
        document.visibilityState !== 'visible'
      ) {
        return;
      }
      const now = await checkMeetingState(workspaceId, oneOnOneId);
      if (cancelled || now === null || isPaused.current) {
        return;
      }
      const change = changeOf(shown.current, now, otherName);
      if (change === null) {
        return;
      }
      refreshedFrom.current = showing;
      if (change !== '') {
        toast(change);
      }
      router.refresh();
    }

    const timer = setInterval(() => void check(), WATCH_EVERY_MS);
    function onVisible() {
      if (document.visibilityState === 'visible') {
        void check();
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [workspaceId, oneOnOneId, otherName, router, isSample]);
}
