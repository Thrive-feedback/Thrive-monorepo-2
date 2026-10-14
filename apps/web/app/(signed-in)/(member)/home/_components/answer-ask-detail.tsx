import { readFeedbackAsk } from '@/app/(signed-in)/(member)/home/_lib/feedback-ask.service';
import { Text } from '@/components/atoms/text';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { AnswerAskForm } from './answer-ask-form';

export type AnswerAskDetailProps = {
  membership: CurrentMembership;
  askId: string;
};

/**
 * Where a Giver answers: who asked, what about, and one box. It is read on every open, so what
 * was written shows after a refresh rather than only in the form that sent it. An Ask that has
 * already been answered gets no box — the first answer is final, so offering one would only
 * earn a refusal from the API.
 *
 * An id that is not an Ask waiting for this person says so in the dialog rather than turning
 * Home into a 404; that is also the answer for one waiting on somebody else.
 */
export async function AnswerAskDetail({
  membership,
  askId,
}: AnswerAskDetailProps) {
  const ask = await readFeedbackAsk(membership, askId);
  if (!ask) {
    return (
      <Text variant="body-2" tone="muted">
        This Ask isn&apos;t waiting for you.
      </Text>
    );
  }
  const asker = ask.requesterName ?? 'A teammate';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Text variant="subtitle-3" as="h3">
          {asker} asked about {ask.topic}
        </Text>
        <Text variant="body-3" tone="muted">
          Only {asker} can read what you write, and your name goes with it.
        </Text>
      </div>
      {ask.status === 'PENDING' ? (
        <AnswerAskForm askId={ask.askId} requesterName={ask.requesterName} />
      ) : (
        <Text variant="body-2">
          You have already answered this. The first answer is the one that
          stands.
        </Text>
      )}
    </div>
  );
}
