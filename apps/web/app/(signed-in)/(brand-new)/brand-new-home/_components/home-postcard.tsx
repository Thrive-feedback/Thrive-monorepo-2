import { ApiError } from '@repo/api';
import { redirect } from 'next/navigation';
import { readHomePostcard } from '@/app/(signed-in)/(brand-new)/brand-new-home/_lib/home-postcard.service';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { type BrandNewHomeShow, ROUTES } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { HomePostcardDialog } from './home-postcard-dialog';

const COULD_NOT_OPEN = "Couldn't open this postcard. Try again.";

export type HomePostcardProps = {
  membership: CurrentMembership;
  feedbackId: string;
  show: BrandNewHomeShow;
};

/** The read, with a failure of the API told apart from a postcard this person may not open. */
async function readOpening(membership: CurrentMembership, feedbackId: string) {
  try {
    return await readHomePostcard(membership, feedbackId);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return 'failed';
  }
}

/**
 * The postcard the address names, read here so the feed does not wait for it, and whatever goes
 * wrong leaves the feed standing. One this person may not open, or that is not there, leaves them
 * on Home under the same filter; a failed read does too, saying so in a toast.
 */
export async function HomePostcard({
  membership,
  feedbackId,
  show,
}: HomePostcardProps) {
  const closeHref = ROUTES.brandNewHomeShowing(show);
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
    <HomePostcardDialog
      title={postcard.title}
      card={postcard.card}
      answerIndex={postcard.answerIndex}
      closeHref={closeHref}
    />
  );
}
