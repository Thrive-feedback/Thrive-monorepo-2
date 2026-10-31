import { useId } from 'react';
import { postmarkDay } from '@/lib/calendar-day.util';
import { cn } from '@/lib/cn.util';
import styles from './postmark.module.css';

// In the drawing's own units, like the rings, so the words grow and shrink with the mark.
const WORD_SIZE = 7;
const WORD_SPACING = 0.6;
const DATE_SIZE = 6;

// The bottom word reads left to right, so its arc runs the other way round and sits further out:
// its letters stand inward from the line, where the top word's stand outward.
const TOP_WORD_ARC = 'M 65.5 32 A 18.5 18.5 0 0 1 102.5 32';
const BOTTOM_WORD_ARC = 'M 60.5 32 A 23.5 23.5 0 0 0 107.5 32';

// How worn the ink is. The rings and waves can take it; the words have to stay readable, so they
// are struck cleaner. `roughness` shakes the edges. `coverage` turns blotchy noise into how much
// ink landed: most of it lands whole, and the noise's low patches, where the rubber pressed
// lightly, thin out.
const LINE_WEAR = {
  roughness: 0.8,
  coverage: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.2 0 0 0 -0.55',
};
const WORD_WEAR = {
  roughness: 0.25,
  coverage: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.2 0 0 0 -0.1',
};

/** Noise from the date, so no two days strike alike, and a server and a browser agree on each. */
function inkSeed(date: string) {
  return [...date].reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0);
}

type InkFilterProps = {
  id: string;
  seed: number;
  wear: typeof LINE_WEAR;
};

/** Roughens what it is applied to and thins it in patches, as a rubber stamp leaves its ink. */
function InkFilter({ id, seed, wear }: InkFilterProps) {
  return (
    <filter
      id={id}
      x="-2%"
      y="-4%"
      width="104%"
      height="108%"
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.8"
        numOctaves="2"
        seed={seed}
        result="grain"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="grain"
        scale={wear.roughness}
        xChannelSelector="R"
        yChannelSelector="G"
        result="roughEdges"
      />
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.22 0.3"
        numOctaves="4"
        seed={seed + 1}
      />
      <feColorMatrix type="matrix" values={wear.coverage} result="coverage" />
      <feComposite in="roughEdges" in2="coverage" operator="in" />
    </filter>
  );
}

export type PostmarkProps = Omit<
  React.ComponentPropsWithRef<'svg'>,
  'children'
> & {
  /** The moment it was posted, as an ISO date. Its day shows in the centre, as "04 OCT", "2026". */
  date: string;
};

/**
 * The mark of something posted, as a rubber stamp leaves it: two rings with who posted it curving
 * between them and the day in the centre, trailing cancelling waves, in uneven ink. Hidden from
 * screen readers, so a date that matters has to be said beside it too. It fills the width of what
 * holds it, keeping its shape; `className` sizes it otherwise. Where it sits and how it moves are
 * the caller's.
 */
export function Postmark({ date, className, ...props }: PostmarkProps) {
  const id = useId();
  const topWordId = `${id}-top`;
  const bottomWordId = `${id}-bottom`;
  const lineInkId = `${id}-line-ink`;
  const wordInkId = `${id}-word-ink`;
  const seed = inkSeed(date);
  const { dayAndMonth, year } = postmarkDay(date);

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 112 64"
      className={cn('w-full text-status-info', className)}
      {...props}
    >
      <defs>
        <path id={topWordId} d={TOP_WORD_ARC} />
        <path id={bottomWordId} d={BOTTOM_WORD_ARC} />
        <InkFilter id={lineInkId} seed={seed} wear={LINE_WEAR} />
        <InkFilter id={wordInkId} seed={seed} wear={WORD_WEAR} />
      </defs>
      <g className={styles.ink} filter={`url(#${lineInkId})`}>
        <circle cx="84" cy="32" r="27" />
        <path d="M0 22 q7 -5 14 0 t14 0 t14 0 t14 0" />
        <path d="M0 32 q7 -5 14 0 t14 0 t14 0 t14 0" />
        <path d="M0 42 q7 -5 14 0 t14 0 t14 0 t14 0" />
        <circle className={styles.fine} cx="84" cy="32" r="15.5" />
      </g>
      <g filter={`url(#${wordInkId})`}>
        <text
          fontSize={WORD_SIZE}
          letterSpacing={WORD_SPACING}
          textAnchor="middle"
          className="fill-current font-display"
        >
          <textPath href={`#${topWordId}`} startOffset="50%">
            Thrive
          </textPath>
        </text>
        <text
          fontSize={WORD_SIZE}
          letterSpacing={WORD_SPACING}
          textAnchor="middle"
          className="fill-current font-display"
        >
          <textPath href={`#${bottomWordId}`} startOffset="50%">
            Team
          </textPath>
        </text>
        <text
          x="84"
          fontSize={DATE_SIZE}
          textAnchor="middle"
          className="fill-current font-display tabular-nums"
        >
          <tspan y="31">{dayAndMonth}</tspan>
          <tspan x="84" y="38">
            {year}
          </tspan>
        </text>
      </g>
    </svg>
  );
}
