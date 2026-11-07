import { TargetLink } from '@/components/molecules/target-link';
import { kudosTiltOf } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { cn } from '@/lib/cn.util';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import styles from './feed-card-preview.module.css';

export type FeedCardLeanProps = {
  /** Whose card it is: picks how it leans, the same on every visit and on the server and browser. */
  id: string;
  className?: string;
  /** The card made small. It is a drawing, inert and unread: what holds it names it. */
  children: React.ReactNode;
};

/**
 * A small card leaning as it would hang on the board, by the one tilt every list and grid gives it.
 * It straightens while the press it sits directly in is pointed at or focused, or while anywhere on
 * a row marked `data-feed-card-row` around it is.
 */
export function FeedCardLean({ id, className, children }: FeedCardLeanProps) {
  return (
    <span
      aria-hidden="true"
      inert
      style={
        { '--feed-card-tilt': `${kudosTiltOf(id)}deg` } as React.CSSProperties
      }
      className={cn('block', styles.leaning, className)}
    >
      {children}
    </span>
  );
}

export type FeedCardPreviewProps = {
  /** Whose card it is: picks how it leans, the same on every visit. */
  id: string;
  /** The card made small. It is a drawing, inert and unread: the label names it. */
  children: React.ReactNode;
} & (
  | {
      /** What pressing it does. */
      target: NavTarget;
      /** What pressing it opens, for a screen reader. */
      label: string;
    }
  | {
      /** Nothing to open yet: it is only a picture. */
      target?: undefined;
      label?: undefined;
    }
);

/**
 * The card a card in a list is about, made small and leaning as `FeedCardLean` leans it. It is the
 * card's one press, and straightens while pointed at or focused.
 *
 * The label can say how long ago something was, and the server and the browser can read the clock
 * either side of a minute, so the browser keeps what the server wrote.
 */
export function FeedCardPreview({
  id,
  target,
  label,
  children,
}: FeedCardPreviewProps) {
  const leaning = <FeedCardLean id={id}>{children}</FeedCardLean>;

  if (!target) {
    return leaning;
  }
  return (
    <TargetLink
      target={target}
      className="block font-normal hover:no-underline"
    >
      <span className="sr-only" suppressHydrationWarning>
        {label}
      </span>
      {leaning}
    </TargetLink>
  );
}
