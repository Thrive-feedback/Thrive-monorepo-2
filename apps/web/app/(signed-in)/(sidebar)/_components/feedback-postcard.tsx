import { ApiError } from '@repo/api';
import { redirect } from 'next/navigation';
import { readFeedbackPostcard } from '@/app/(signed-in)/(sidebar)/_lib/feedback-postcard.service';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { FeedbackPostcardDialog } from './feedback-postcard-dialog';

const COULD_NOT_OPEN = "Couldn't open this postcard. Try again.";

export type FeedbackPostcardProps = {
  membership: CurrentMembership;
  feedbackId: string;
  /** Where closing it, or failing to open it, leaves the person. */
  closeHref: string;
};

/** The read, with a failure of the API told apart from a postcard this person may not open. */
async function readOpening(membership: CurrentMembership, feedbackId: string) {
  try {
    return await readFeedbackPostcard(membership, feedbackId);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return 'failed';
  }
}

/**
 * The postcard the address names, read here so the list under it does not wait for it, and
 * whatever goes wrong leaves the list standing. One this person may not open, or that is not there,
 * leaves them where they were; a failed read does too, saying so in a toast.
 */
export async function FeedbackPostcard({
  membership,
  feedbackId,
  closeHref,
}: FeedbackPostcardProps) {
  const postcard = await readOpening(membership, feedbackId);

  if (postcard === 'failed') {
    return (
      <OneTimeToast type="error" message={COULD_NOT_OPEN} then={closeHref} />
    );
  }
  if (!postcard) {
    redirect(closeHref);
  }
  return (
    <FeedbackPostcardDialog
      title={postcard.title}
      person={postcard.person ?? undefined}
      card={postcard.card}
      answerIndex={postcard.answerIndex}
      closeHref={closeHref}
    />
  );
}
