import { cn } from '@/lib/cn.util';

export type HandUnderlineProps = {
  children: React.ReactNode;
  /** The words keep to one line; a caller whose words may be long, such as a name, lets them wrap. */
  className?: string;
};

/**
 * Two quick pen strokes under the words they mark, drawn in the secondary colour, which belongs
 * to the human voice as purple belongs to the product. The strokes are decoration, so assistive
 * technology reads only the words.
 */
export function HandUnderline({ children, className }: HandUnderlineProps) {
  return (
    <span className={cn('relative inline-block whitespace-nowrap', className)}>
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 16"
        preserveAspectRatio="none"
        fill="none"
        className="absolute -bottom-2 left-0 h-4 w-full overflow-visible text-action-secondary"
      >
        <path
          d="M3 9 C 48 3, 120 2, 197 7"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M24 14 C 80 9, 146 9, 186 12"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}
