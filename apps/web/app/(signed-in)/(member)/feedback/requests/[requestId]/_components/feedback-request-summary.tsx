import { Card } from '@/components/atoms/card';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import type { SentFeedbackRequest } from '../_lib/feedback-request.service';

export type FeedbackRequestSummaryProps = {
  request: SentFeedbackRequest;
};

/** What each Ask's status means to the person who sent the request. */
const ASK_STATUS_WORDS: Readonly<
  Record<SentFeedbackRequest['asks'][number]['status'], string>
> = {
  PENDING: 'waiting for their answer',
  ANSWERED: 'answered',
  EXPIRED: 'expired without an answer',
};

/**
 * The confirmation, and afterwards the place the Requester reads what came back. It is read
 * from what was stored rather than from what was typed, so a reload or a shared link shows the
 * same thing — and an answer written since appears without anybody being told to look.
 */
export function FeedbackRequestSummary({
  request,
}: FeedbackRequestSummaryProps) {
  return (
    <Card title="Your request is on its way" className="m-auto max-w-150">
      <div className="flex flex-col gap-6">
        <ul className="flex flex-col gap-3">
          {request.asks.map((ask) => (
            <li key={ask.askId} className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <Text variant="subtitle-3" as="h2">
                  You asked {ask.giverName ?? 'a teammate'} about{' '}
                  {request.topic}
                </Text>
                <Text variant="body-3" tone="muted">
                  Now {ASK_STATUS_WORDS[ask.status]}.
                </Text>
              </div>
              {ask.answer !== null && (
                // Their words, kept as they wrote them: the line breaks they chose are part of
                // the answer, and a paragraph run together reads as a different message.
                <Text variant="body-2" className="whitespace-pre-line">
                  {ask.answer}
                </Text>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-4">
          <Link href={ROUTES.home}>Ask someone else</Link>
          <Link href={ROUTES.home}>Back to Home</Link>
        </div>
      </div>
    </Card>
  );
}
