import { Card } from '@/components/atoms/card';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import type { WaitingAsk } from '../_lib/feedback-ask.service';
import { AnswerAskForm } from './answer-ask-form';

export type AnswerAskCardProps = {
  ask: WaitingAsk;
};

/**
 * The screen a Giver answers on: who asked, what about, and one box. An Ask that has already
 * been answered gets no box — the first answer is final, so offering one would only earn a
 * refusal from the API.
 */
export function AnswerAskCard({ ask }: AnswerAskCardProps) {
  const asker = ask.requesterName ?? 'A teammate';

  return (
    <Card title="Give your feedback" className="m-auto max-w-150">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Text variant="subtitle-3" as="h2">
            {asker} asked about {ask.topic}
          </Text>
          <Text variant="body-3" tone="muted">
            Only {asker} can read what you write, and your name goes with it.
          </Text>
        </div>
        {ask.status === 'PENDING' ? (
          <AnswerAskForm askId={ask.askId} requesterName={ask.requesterName} />
        ) : (
          <div className="flex flex-col gap-4">
            <Text variant="body-2">
              You have already answered this. The first answer is the one that
              stands.
            </Text>
            <Link href={ROUTES.feedback.asks}>Back to Waiting for me</Link>
          </div>
        )}
      </div>
    </Card>
  );
}
