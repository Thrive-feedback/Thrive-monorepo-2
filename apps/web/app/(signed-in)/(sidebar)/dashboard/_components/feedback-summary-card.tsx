import { LockIcon } from 'lucide-react';
import { Badge } from '@/components/atoms/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/atoms/card';
import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import type { FeedbackSummary } from '../_lib/feedback-summary.type';
import { quarterRead } from '../_lib/quarter.util';
import { SummarySection } from './summary-section';

export type FeedbackSummaryCardProps = {
  summary: FeedbackSummary;
};

/**
 * What the Feedback written to this person over one quarter adds up to.
 *
 * The head says when it was written and from how many messages, because a page that reads as
 * live would be lying: it is written off to one side and can be behind by the time it is opened,
 * which is what `isStale` says out loud rather than hiding.
 */
export function FeedbackSummaryCard({ summary }: FeedbackSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="items-start gap-2 text-start">
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2">
          <CardTitle>Your summary</CardTitle>
          <Badge tone="neutral" size="sm">
            {quarterRead(summary.period)}
          </Badge>
          {summary.isStale && (
            <Badge tone="info" size="sm" edged>
              New feedback since
            </Badge>
          )}
        </div>
        <Text as="p" variant="body-2" tone="muted">
          Written <TimeAgo dateTime={summary.generatedAt} />{' '}
          {/* One string, so the full stop lands against the last word rather than a line break
              away from it. */}
          {`from ${summary.sourceCount} messages${
            summary.isStale ? '. A newer one is being written.' : '.'
          }`}
        </Text>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        {summary.sections.map((section) => (
          <SummarySection key={section.name} section={section} />
        ))}
      </CardContent>
      <CardFooter>
        <LockIcon aria-hidden="true" className="size-4 text-fg-secondary" />
        <Text as="p" variant="caption" tone="muted">
          Only you can read this. It is written from the Feedback and Kudos
          people wrote to you, and every point links to the one it came from —
          worth opening, because a summary can read well and still say something
          its message did not.
        </Text>
      </CardFooter>
    </Card>
  );
}
