import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/session/session.service';
import { FeedbackRequestSummary } from './_components/feedback-request-summary';
import { readFeedbackRequest } from './_lib/feedback-request.service';
import { RequestParams } from './_lib/request-params.schema';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Your feedback request',
  robots: { index: false, follow: false },
};

type FeedbackRequestPageProps = {
  params: Promise<{ requestId: string }>;
};

/**
 * What was sent, read back from the store on every load — so a refresh, a new tab or a
 * returning visit all show the request rather than a message that only existed in the form.
 *
 * An id that is not this Workspace's is not found, which is also the answer for an id that
 * belongs to another Workspace.
 */
export default async function FeedbackRequestPage({
  params,
}: FeedbackRequestPageProps) {
  const segment = RequestParams.safeParse(await params);
  if (!segment.success) {
    notFound();
  }
  const session = await requireMember();
  const request = await readFeedbackRequest(
    session.membership,
    segment.data.requestId,
  );
  if (!request) {
    notFound();
  }

  return <FeedbackRequestSummary request={request} />;
}
