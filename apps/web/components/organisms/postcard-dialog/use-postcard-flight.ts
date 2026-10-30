import {
  easingDefinitionToFunction,
  useAnimate,
  useReducedMotion,
} from 'motion/react';
import { useRef, useState } from 'react';
import {
  type Curve,
  centerWithin,
  curvePath,
  type Point,
  postmarkPoint,
  readMotionSteps,
  sampleCurve,
} from './postcard-flight.util';

/** How many points the flight is drawn through: enough that it reads as a curve. */
const FLIGHT_POINTS = 24;

/** How small the card is as it leaves the screen, against its size on the table. */
const LEAVING_SCALE = 0.001;

/**
 * Sending a postcard by airmail: a postmark comes down on its stamp, the card gives under it, then
 * flies off in an arc past the top-right of the screen, a contrail drawn on behind it.
 *
 * `prepare` measures where the postmark lands and the course the card will take, and is called
 * in the same commit that marks the card as sent, so both are drawn before `fly` moves them.
 * With reduced motion there is neither postmark nor flight, and `fly` settles at once.
 */
export function usePostcardFlight() {
  const [cardRef, animate] = useAnimate<HTMLDivElement>();
  const contrailRef = useRef<SVGSVGElement>(null);
  const reduceMotion = useReducedMotion() === true;
  const [postmarkAt, setPostmarkAt] = useState<Point | null>(null);
  const [contrail, setContrail] = useState<string | null>(null);
  const courseRef = useRef<Curve | null>(null);

  function prepare() {
    const card = cardRef.current;
    const layer = contrailRef.current;
    if (reduceMotion || !card || !layer) {
      return;
    }
    // Measured in the contrail's own layer, which scrolls with the dialog, out to the top-right
    // corner of the screen: dipping first as it gathers speed, then climbing.
    const start = centerWithin(layer, card);
    const origin = layer.getBoundingClientRect();
    const end = { x: window.innerWidth - origin.left, y: -origin.top };
    const across = end.x - start.x;
    const up = end.y - start.y;
    const course: Curve = [
      start,
      { x: start.x + across * 0.15, y: start.y - up * 0.15 },
      { x: start.x + across * 0.45, y: start.y + up * 0.2 },
      end,
    ];
    courseRef.current = course;
    setContrail(curvePath(course));
    setPostmarkAt(postmarkPoint(card));
  }

  async function fly() {
    const card = cardRef.current;
    const course = courseRef.current;
    const postmark = card?.querySelector('[data-postmark]');
    const reveal = contrailRef.current?.querySelector('[data-contrail-reveal]');
    if (reduceMotion || !card || !course || !postmark || !reveal) {
      return;
    }
    const { duration, ease, pressScale } = readMotionSteps(card);

    await animate(
      postmark,
      { opacity: 1, scale: 1, rotate: -8 },
      { duration: duration.quick, ease: ease.linear },
    );
    await animate(
      card,
      { scale: [1, pressScale, 1] },
      { duration: duration.fast, ease: ease.bounce },
    );

    const [start] = course;
    const points = sampleCurve(
      course,
      FLIGHT_POINTS,
      easingDefinitionToFunction(ease.inOut),
    );
    const last = points.length - 1;
    const along = (from: number, to: number) =>
      points.map((_, index) => from + ((to - from) * index) / last);
    const flight = {
      duration: duration.verySlow + duration.slow,
      delay: duration.medium,
    };
    await Promise.all([
      animate(
        card,
        {
          x: points.map((point) => point.x - start.x),
          y: points.map((point) => point.y - start.y),
          rotate: along(0, -48),
          scale: along(1, LEAVING_SCALE),
          opacity: points.map((_, index) => (index === last ? 0 : 1)),
        },
        { ...flight, ease: ease.linear },
      ),
      animate(reveal, { pathLength: 1 }, { ...flight, ease: ease.inOut }),
    ]);
  }

  return { cardRef, contrailRef, postmarkAt, contrail, prepare, fly };
}
