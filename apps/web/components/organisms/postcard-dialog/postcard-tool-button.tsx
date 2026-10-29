import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { cn } from '@/lib/cn.util';

export type PostcardToolButtonProps = React.ComponentPropsWithRef<'button'>;

/**
 * One tool on the postcard's floating bar: quiet until hovered, and shaded while the menu it
 * opens is open. Tall enough to be a comfortable target on a touch screen, and narrower there,
 * so a bar of them fits a phone without scrolling.
 */
export function PostcardToolButton({
  className,
  ...rest
}: PostcardToolButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-button px-2.5 text-body-2 text-fg-primary hover:bg-action-neutral-surface-hover aria-disabled:cursor-not-allowed aria-disabled:text-fg-disabled aria-disabled:hover:bg-transparent data-[state=open]:bg-action-neutral-surface-hover max-sm:gap-1 max-sm:px-1.5',
        className,
      )}
      {...rest}
    />
  );
}

/** The hairline between groups of tools; on a phone the tools sit close enough without it. */
export function PostcardToolDivider() {
  return (
    <span
      aria-hidden="true"
      className="mx-0.5 h-6 w-px shrink-0 bg-border-muted max-sm:hidden"
    />
  );
}

export type PostcardSoonToolProps = {
  /** What the tool will do, said on hover and focus. */
  soon: string;
  children: React.ReactNode;
};

/**
 * A tool the bar shows where it will be, before it works: reachable, so its tooltip can say it
 * is coming, but marked as not available.
 */
export function PostcardSoonTool({ soon, children }: PostcardSoonToolProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <PostcardToolButton aria-disabled="true">{children}</PostcardToolButton>
      </TooltipTrigger>
      <TooltipContent>{soon}</TooltipContent>
    </Tooltip>
  );
}
