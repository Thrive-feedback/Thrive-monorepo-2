import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/session/session.service';
import { AnswerAskCard } from './_components/answer-ask-card';
import { AskParams } from './_lib/ask-params.schema';
import { readFeedbackAsk } from './_lib/feedback-ask.service';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Give your feedback',
  robots: { index: false, follow: false },
};

type AnswerAskPageProps = {
  params: Promise<{ askId: string }>;
};

/**
 * Answering one Ask, read back from the store on every load — so what was written shows after
 * a refresh rather than only in the form that sent it.
 *
 * An id that is not an Ask waiting for this person is not found, which is also the answer for
 * one waiting on somebody else.
 */
export default async function AnswerAskPage({ params }: AnswerAskPageProps) {
  const segment = AskParams.safeParse(await params);
  if (!segment.success) {
    notFound();
  }
  const session = await requireMember();
  const ask = await readFeedbackAsk(session.membership, segment.data.askId);
  if (!ask) {
    notFound();
  }

  return <AnswerAskCard ask={ask} />;
}
