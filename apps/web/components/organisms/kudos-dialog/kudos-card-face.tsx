import { cn } from '@/lib/cn.util';
import styles from './kudos-card.module.css';
import {
  KUDOS_TEMPLATES,
  type KudosTemplateKey,
} from './kudos-template.constant';

/** The card's own drawing space, which every border is measured in. */
const WIDTH = 240;
const HEIGHT = 320;

const SQUIGGLE_INSET = 15;
const SQUIGGLE_HEIGHT = 3.2;
const SQUIGGLE_WAVELENGTH = 22;
const SQUIGGLE_STEP = 4;

/** A closed wavy line round the card, set in from its edge. */
function squigglePath() {
  const points: string[] = [];
  function along(
    from: readonly [number, number],
    to: readonly [number, number],
  ) {
    const [startX, startY] = from;
    const [endX, endY] = to;
    const length = Math.hypot(endX - startX, endY - startY);
    const normalX = (endY - startY) / length;
    const normalY = (startX - endX) / length;
    const steps = Math.round(length / SQUIGGLE_STEP);
    for (let step = 0; step < steps; step += 1) {
      const share = step / steps;
      const wave =
        Math.sin(((share * length) / SQUIGGLE_WAVELENGTH) * 2 * Math.PI) *
        SQUIGGLE_HEIGHT;
      const x = startX + (endX - startX) * share + normalX * wave;
      const y = startY + (endY - startY) * share + normalY * wave;
      points.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    }
  }
  const near = SQUIGGLE_INSET;
  const right = WIDTH - near;
  const bottom = HEIGHT - near;
  along([near, near], [right, near]);
  along([right, near], [right, bottom]);
  along([right, bottom], [near, bottom]);
  along([near, bottom], [near, near]);
  return `M${points.join('L')}Z`;
}

const SQUIGGLE = squigglePath();

/** The two borders CSS cannot draw. Decoration only. */
function KudosCardBorder({ templateKey }: { templateKey: KudosTemplateKey }) {
  if (templateKey !== 'cobalt-dash' && templateKey !== 'red-squiggle') {
    return null;
  }
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={cn('absolute inset-0 size-full', styles.border)}
    >
      {templateKey === 'cobalt-dash' ? (
        <rect
          x="14"
          y="14"
          width="212"
          height="292"
          rx="10"
          strokeWidth="4.5"
          strokeDasharray="9 15"
        />
      ) : (
        <path d={SQUIGGLE} strokeWidth="3.2" />
      )}
    </svg>
  );
}

export type KudosCardFaceProps = {
  templateKey: KudosTemplateKey;
  className?: string;
  /** What lies on the card, above its border. */
  children?: React.ReactNode;
};

/**
 * A Kudos card with nothing written on it: portrait, one side, at whatever width it is given. The
 * row of templates and the board draw it small, and the editor puts the words and stickers on it.
 */
export function KudosCardFace({
  templateKey,
  className,
  children,
}: KudosCardFaceProps) {
  return (
    <div className={cn('relative aspect-3/4 w-full', styles.card, className)}>
      <div
        className={cn(
          'absolute inset-0 overflow-hidden',
          styles.face,
          KUDOS_TEMPLATES[templateKey].className,
        )}
      >
        <KudosCardBorder templateKey={templateKey} />
        {children}
      </div>
    </div>
  );
}
