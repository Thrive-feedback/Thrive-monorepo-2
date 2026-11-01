import { readMotionSteps } from '@/components/organisms/postcard-dialog/postcard-flight.util';

/** A little shake that dies away. Only a turn: it held 60 fps with six cards going at once. */
const SHAKE: Keyframe[] = [
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(-2.5deg)', offset: 0.2 },
  { transform: 'rotate(2deg)', offset: 0.45 },
  { transform: 'rotate(-1.2deg)', offset: 0.7 },
  { transform: 'rotate(0.6deg)', offset: 0.85 },
  { transform: 'rotate(0deg)' },
];

/** The cards shaking now, so a card passed over twice does not start again. */
const shaking = new WeakSet<Element>();

/** Read once, at the first shake: the tokens do not change, and reading makes the browser work. */
let shakeMilliseconds: number | undefined;

/**
 * Shakes a card, on top of whatever lean it hangs at. It runs to its end whether or not the cursor
 * stays, which a CSS `:hover` cannot: one left at once would snap straight, so a quick pass would
 * look like a twitch. No state, so no card is drawn again.
 */
export function shakeKudosCard(card: Element) {
  if (shaking.has(card)) {
    return;
  }
  shakeMilliseconds ??= readMotionSteps(card).duration.slow * 1000;
  shaking.add(card);
  card.animate(SHAKE, {
    duration: shakeMilliseconds,
    easing: 'ease-in-out',
  }).onfinish = () => shaking.delete(card);
}
