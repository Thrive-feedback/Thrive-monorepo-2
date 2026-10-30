import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { PostcardSide } from './postcard-draft.type';
import { usePostcardFlight } from './use-postcard-flight';

/**
 * How long a send made from the front waits for the card to turn over. A tab in the background may
 * not run the turn at all, and a send must not hang on an animation.
 */
const TURN_LIMIT_MS = 1000;

/**
 * How far a card has got. `posting` waits to hear whether it went, so nothing has left the screen;
 * `flying` has gone, and is being postmarked and flown off.
 */
export type PostcardSendStatus = 'writing' | 'posting' | 'flying';

export type UsePostcardSendOptions = {
  /** Hands the card over, and says whether it went. */
  handOver: () => Promise<boolean>;
  /** What is selected on the card lets go: it is being turned over, or flown off. */
  onLetGo: () => void;
  /** Focus holds here while the card is inert: it is what is left to hold it. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Focus comes back here after a send that did not go. */
  sendRef: React.RefObject<HTMLElement | null>;
  /** The flight has settled: ended, cut short or failed. */
  onSent: () => void;
};

/**
 * The side of the card showing, and sending it: the two belong together, because what is sent is
 * the written side, so a card sent from its front turns over first, and so does one still turning.
 *
 * The card flies only once it has gone, so a send that fails leaves the writer with everything
 * they wrote, the cursor back on Send and the caller saying why. It is then postmarked and flown
 * off by airmail, and `onSent` follows once the flight has settled. With reduced motion there is
 * no flight, and it follows at once. See ADR 0069.
 */
export function usePostcardSend({
  handOver,
  onLetGo,
  containerRef,
  sendRef,
  onSent,
}: UsePostcardSendOptions) {
  const [side, setSide] = useState<PostcardSide>('back');
  const [status, setStatus] = useState<PostcardSendStatus>('writing');
  // Set while the card is turning, to what to do once it has.
  const afterTurnRef = useRef<(() => void) | null>(null);
  const isTurningRef = useRef(false);
  const flight = usePostcardFlight();

  function turnOver() {
    isTurningRef.current = true;
    setSide((current) => (current === 'back' ? 'front' : 'back'));
  }

  function handleTurned() {
    isTurningRef.current = false;
    afterTurnRef.current?.();
  }

  // Resolves once the card shows its back, or once it has been given long enough to.
  function turnToBack() {
    if (side === 'back' && !isTurningRef.current) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const settle = () => {
        clearTimeout(limit);
        afterTurnRef.current = null;
        resolve();
      };
      const limit = setTimeout(settle, TURN_LIMIT_MS);
      afterTurnRef.current = settle;
      isTurningRef.current = true;
      onLetGo();
      setSide('back');
    });
  }

  async function send() {
    // The card goes inert from here on, which would drop focus from Send onto the page; the
    // dialog itself holds it until Send or the opener gets it back. It is a container, not a
    // control, so it draws no focus ring while it does.
    containerRef.current?.focus();
    setStatus('posting');
    await turnToBack();
    const hasGone = await handOver().catch(() => false);
    // Only if this card is still on the page: one closed and opened again meanwhile is a new card.
    if (!flight.cardRef.current?.isConnected) {
      return;
    }
    if (!hasGone) {
      flushSync(() => setStatus('writing'));
      sendRef.current?.focus();
      return;
    }
    // The postmark and the contrail are drawn in the same commit, so the flight finds them.
    flushSync(() => {
      onLetGo();
      setStatus('flying');
      flight.prepare();
    });
    void flight
      .fly()
      .catch(() => undefined)
      .then(() => {
        if (flight.cardRef.current?.isConnected) {
          onSent();
        }
      });
  }

  return { side, status, flight, turnOver, handleTurned, send };
}
