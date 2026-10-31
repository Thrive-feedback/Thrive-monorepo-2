import { useState } from 'react';
import { flushSync } from 'react-dom';
import { useKudosPin } from './use-kudos-pin';

/**
 * How far a card has got. `posting` waits to hear whether it went, so nothing has left the screen;
 * `pinning` has gone, and is being pinned to the board; `pinned` is there, and waits for the Giver.
 */
export type KudosSendStatus = 'writing' | 'posting' | 'pinning' | 'pinned';

export type UseKudosSendOptions = {
  /** Hands the card over, and says whether it went. */
  handOver: () => Promise<boolean>;
  /** What is selected on the card lets go: it is being pinned. */
  onLetGo: () => void;
  /** Focus holds here while the card is inert: it is what is left to hold it. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Focus comes back here after a send that did not go. */
  sendRef: React.RefObject<HTMLElement | null>;
  /** The card has landed, or the landing was cut short or failed: what comes next is on show. */
  onPinned: () => void;
};

/**
 * Sending a Kudos. As with a postcard (ADR 0069), it moves only once it has gone, so a send that
 * fails leaves the Giver with everything they wrote, the cursor back on Send and the caller saying
 * why.
 */
export function useKudosSend({
  handOver,
  onLetGo,
  containerRef,
  sendRef,
  onPinned,
}: UseKudosSendOptions) {
  const [status, setStatus] = useState<KudosSendStatus>('writing');
  const pin = useKudosPin();

  async function send() {
    // The card goes inert from here on, which would drop focus from Send onto the page; the
    // dialog itself holds it until Send or the opener gets it back.
    containerRef.current?.focus();
    setStatus('posting');
    const hasGone = await handOver().catch(() => false);
    // Only if this card is still on the page: one closed and opened again meanwhile is a new card.
    if (!pin.cardRef.current?.isConnected) {
      return;
    }
    if (!hasGone) {
      flushSync(() => setStatus('writing'));
      sendRef.current?.focus();
      return;
    }
    // The board is drawn in the same commit, so `pin` finds it there to measure.
    flushSync(() => {
      onLetGo();
      setStatus('pinning');
      pin.prepare();
    });
    void pin
      .pin()
      .catch(() => undefined)
      .then(() => {
        if (pin.cardRef.current?.isConnected) {
          flushSync(() => setStatus('pinned'));
          onPinned();
        }
      });
  }

  return { status, pin, send };
}
