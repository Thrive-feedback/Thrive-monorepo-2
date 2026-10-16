import { answerAsk } from '@/app/(signed-in)/(member)/home/_lib/answer-ask-actions.service';
import { readFeedbackAsk } from '@/app/(signed-in)/(member)/home/_lib/feedback-ask.service';
import { AnswerAskView } from '@/components/organisms/answer-ask-view';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type AnswerAskDetailProps = {
  membership: CurrentMembership;
  askId: string;
};

/**
 * The Ask open over Home, read on every open, so what was written shows after a refresh rather
 * than only in the form that sent it. The answer goes to the API through `answerAsk`.
 */
export async function AnswerAskDetail({
  membership,
  askId,
}: AnswerAskDetailProps) {
  const ask = await readFeedbackAsk(membership, askId);
  return <AnswerAskView ask={ask} action={answerAsk} />;
}
