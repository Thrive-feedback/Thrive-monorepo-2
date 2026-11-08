import Link from 'next/link';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import type { SummarySource } from '../_lib/feedback-summary.type';

export type SummaryPointSourcesProps = {
  sources: readonly SummarySource[];
};

/** Where a cited message is read: the piece of Feedback itself, or the Kudos among the others. */
function hrefOf(source: SummarySource): string {
  return source.kind === 'FEEDBACK'
    ? ROUTES.receivedFeedback(source.id)
    : ROUTES.receivedViewing('list', 'kudos');
}

/** What a reader is told the link opens, since the number alone says nothing on its own. */
function nameOf(source: SummarySource, position: number): string {
  return source.kind === 'FEEDBACK'
    ? `Open the Feedback this came from (${position})`
    : `Open the Kudos this came from (${position})`;
}

/**
 * The messages one point was read from, each a numbered link to the message itself.
 *
 * **Shown, never folded away.** Provenance is what lets somebody check a sentence against what
 * was actually written to them, and a model's paraphrase can reverse a meaning while citing the
 * right message — so a link nobody can see is a decoration rather than a safeguard.
 */
export function SummaryPointSources({ sources }: SummaryPointSourcesProps) {
  if (sources.length === 0) {
    // Only a suggested action may stand on nothing, and it follows from the points above it.
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <Text as="span" variant="caption" tone="muted">
        From
      </Text>
      {sources.map((source, index) => (
        <Link
          key={source.id}
          href={hrefOf(source)}
          aria-label={nameOf(source, index + 1)}
          className={cn(
            'inline-flex size-6 items-center justify-center rounded-chip border border-border-default text-caption text-fg-secondary',
            'transition-colors hover:border-border-strong hover:bg-action-neutral-surface-hover hover:text-fg-primary',
          )}
        >
          {index + 1}
        </Link>
      ))}
    </div>
  );
}
