import {
  readFeedbackRequest,
  type SentFeedbackRequest,
} from '@/app/(signed-in)/(member)/home/_lib/feedback-request.service';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { AnswerReaders } from '@/components/organisms/answer-readers';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { PersonChip } from '@/components/organisms/person-chip';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type FeedbackRequestDetailProps = {
  membership: CurrentMembership;
  requestId: string;
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
 * One request the person sent, and the place they read what came back. It is read from what
 * was stored on every open, so a reload or a shared link shows the same thing — and an answer
 * written since appears without anybody being told to look.
 *
 * An id this Workspace has no request for says so in the dialog rather than turning Home into
 * a 404; that is also the answer for another Workspace's request.
 */
export async function FeedbackRequestDetail({
  membership,
  requestId,
}: FeedbackRequestDetailProps) {
  const request = await readFeedbackRequest(membership, requestId);
  if (!request) {
    return (
      <Text variant="body-2" tone="muted">
        This request isn&apos;t here any more.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {request.asks.map((ask) => (
          <li key={ask.askId} className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <Text variant="subtitle-3" as="h3">
                You asked{' '}
                <PersonChip
                  person={{
                    name: ask.giverName,
                    photoUrl: ask.giverPhotoUrl,
                    inactive: ask.giverInactive,
                    isYou: false,
                  }}
                  unnamed="a teammate"
                  className="align-middle"
                />
                :{' '}
                <FeedbackText
                  text={request.message}
                  tags={request.messageTags}
                />
              </Text>
              <Text variant="body-3" tone="muted">
                Now {ASK_STATUS_WORDS[ask.status]}.
              </Text>
            </div>
            {ask.answer !== null && (
              // Their words, kept as they wrote them: the line breaks they chose are part of
              // the answer, and a paragraph run together reads as a different message.
              <Text variant="body-2" className="whitespace-pre-line">
                <FeedbackText
                  text={ask.answer.message}
                  tags={ask.answer.tags}
                />
              </Text>
            )}
          </li>
        ))}
      </ul>
      {request.visibility && <AnswerReaders readers={request.visibility} />}
    </div>
  );
}

/** A `FeedbackRequestDetail` still loading: two Asks, each who and where it stands, and who reads them. */
export function FeedbackRequestDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {['first', 'second'].map((ask) => (
          <div key={ask} className="flex flex-col gap-1">
            <Skeleton className="w-3/4 text-subtitle-3" />
            <Skeleton className="w-1/3 text-body-3" />
          </div>
        ))}
      </div>
      <Skeleton className="w-2/3 text-body-3" />
    </div>
  );
}
