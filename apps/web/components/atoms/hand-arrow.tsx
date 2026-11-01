import { cn } from '@/lib/cn.util';

export type HandArrowProps = {
  /** Its size, and a turn or a flip to point anywhere but right. */
  className?: string;
};

/**
 * An arrow drawn by hand, pointing right, in the colour of the words around it. It only points the
 * way, so assistive technology skips it.
 */
export function HandArrow({ className }: HandArrowProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-5 w-12 shrink-0', className)}
    >
      <path d="M2 11c8-5 14 3 22-1s12-2 21-1" />
      <path d="M38 3l7 6-8 6" />
    </svg>
  );
}
