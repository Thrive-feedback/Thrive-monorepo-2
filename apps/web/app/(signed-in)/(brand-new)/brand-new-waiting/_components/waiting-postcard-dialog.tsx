'use client';

import dynamic from 'next/dynamic';
import { unstable_rethrow, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { sendPostcardAnswer } from '@/app/(signed-in)/(brand-new)/_lib/send-postcard-actions.service';
import { toSentAnswer } from '@/app/(signed-in)/(brand-new)/_lib/sent-postcard.util';
import type {
  PostcardAnswer,
  PostcardAsk,
  PostcardWriter,
} from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { useAnsweredAsks } from './answered-asks';
import { WAITING_HEADING_ID } from './waiting-heading.constant';

/** The postcard is the heaviest thing on the page, so its code arrives on its own. */
const PostcardDialog = dynamic(
  () =>
    import('@/components/organisms/postcard-dialog/postcard-dialog').then(
      (postcard) => postcard.PostcardDialog,
    ),
  { ssr: false },
);

const COULD_NOT_SEND = "We couldn't send your answer. Please try again.";

export type WaitingPostcardDialogProps = {
  /** The Workspace the page was drawn for, which the answer is sent to. */
  workspaceId: string;
  askId: string;
  /** Where closing it goes: the list in the order it was opened from. */
  closeHref: string;
  ask: PostcardAsk;
  writer: PostcardWriter;
  /** Who `@` offers on the answer. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
};

/**
 * The postcard a card on Waiting for me opened. It is open because the address says so, but it
 * closes at once rather than waiting for the navigation that takes that away. What it remembers is
 * the card it closed, so pressing that card again meanwhile, which brings a fresh read, opens it
 * rather than finding it shut. An answer that went takes its card out of the list and the count
 * down once the card has flown off, so nothing moves behind it in flight.
 */
export function WaitingPostcardDialog({
  workspaceId,
  askId,
  closeHref,
  ask,
  writer,
  teammates,
  workspaceGoals,
}: WaitingPostcardDialogProps) {
  const router = useRouter();
  const [closedAsk, setClosedAsk] = useState<PostcardAsk | null>(null);
  const hasSent = useRef(false);
  const { markAnswered } = useAnsweredAsks();

  async function handleSend(answer: PostcardAnswer) {
    try {
      const { formError } = await sendPostcardAnswer(
        workspaceId,
        askId,
        toSentAnswer(answer),
      );
      if (formError) {
        toast.error(formError);
        return false;
      }
    } catch (error) {
      // Being signed out rejects the action with a redirect, which is not a send that failed.
      unstable_rethrow(error);
      toast.error(COULD_NOT_SEND);
      return false;
    }
    hasSent.current = true;
    toast.success('Answer sent.');
    return true;
  }

  function handleOpenChange(open: boolean) {
    if (open) {
      return;
    }
    setClosedAsk(ask);
    router.replace(closeHref, { scroll: false });
    if (hasSent.current) {
      markAnswered(askId);
      router.refresh();
    }
  }

  // The card that opened this is gone once it is answered, so focus has nowhere to go back to. It
  // goes to the title without scrolling there, so the person stays where they were in the list.
  function handleCloseAutoFocus(event: Event) {
    if (hasSent.current) {
      event.preventDefault();
      document
        .getElementById(WAITING_HEADING_ID)
        ?.focus({ preventScroll: true });
    }
  }

  return (
    <PostcardDialog
      kind="answer"
      title="Answer"
      ask={ask}
      writer={writer}
      teammates={teammates}
      workspaceGoals={workspaceGoals}
      open={closedAsk !== ask}
      onOpenChange={handleOpenChange}
      onSend={handleSend}
      onCloseAutoFocus={handleCloseAutoFocus}
    />
  );
}
