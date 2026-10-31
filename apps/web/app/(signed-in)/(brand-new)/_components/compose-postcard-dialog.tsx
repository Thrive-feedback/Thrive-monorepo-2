'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { deliverCard } from '@/app/(signed-in)/(brand-new)/_lib/deliver-card.util';
import {
  sendPostcardFeedback,
  sendPostcardRequest,
} from '@/app/(signed-in)/(brand-new)/_lib/send-postcard-actions.service';
import { toSentPostcard } from '@/app/(signed-in)/(brand-new)/_lib/sent-postcard.util';
import type {
  PostcardDraft,
  PostcardWriter,
} from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';

/**
 * The postcard is the heaviest thing on the page and nobody needs it until they choose to write,
 * so its code arrives on its own.
 */
const PostcardDialog = dynamic(
  () =>
    import('@/components/organisms/postcard-dialog/postcard-dialog').then(
      (postcard) => postcard.PostcardDialog,
    ),
  { ssr: false },
);

/** Fetches the postcard's code ahead of a choice; a failed fetch is retried when it is drawn. */
export function warmPostcardDialog() {
  import('@/components/organisms/postcard-dialog/postcard-dialog').catch(
    () => {},
  );
}

/** Which card is written, and what it is called in the toast that says it went. */
export type ComposeCard = 'give' | 'ask';

const SENT: Readonly<Record<ComposeCard, string>> = {
  give: 'Feedback sent.',
  ask: 'Request sent.',
};

const COULD_NOT_SEND = "We couldn't send your postcard. Please try again.";

export type ComposePostcardDialogProps = {
  /** The Workspace the page was drawn for, which a card is sent to. */
  workspaceId: string;
  /** Who a postcard can be for, and who `@` offers on it. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
  card: ComposeCard;
  title: string;
  /** What is already written as it opens, as typed before choosing this card. */
  defaultMessage?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A card went, and has flown off. */
  onSent?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * A postcard to give Feedback or ask for it, sent to the API with the card itself. Once it has
 * flown off the page reads again, so what was sent is there.
 */
export function ComposePostcardDialog({
  workspaceId,
  teammates,
  workspaceGoals,
  writer,
  card,
  title,
  defaultMessage,
  open,
  onOpenChange,
  onSent,
  onCloseAutoFocus,
}: ComposePostcardDialogProps) {
  const router = useRouter();
  const hasSent = useRef(false);

  async function handleSend(postcard: PostcardDraft) {
    const send = card === 'give' ? sendPostcardFeedback : sendPostcardRequest;
    const hasGone = await deliverCard(
      () => send(workspaceId, toSentPostcard(postcard)),
      SENT[card],
      COULD_NOT_SEND,
    );
    hasSent.current = hasGone;
    return hasGone;
  }

  function handleOpenChange(isOpen: boolean) {
    onOpenChange(isOpen);
    if (!isOpen && hasSent.current) {
      hasSent.current = false;
      onSent?.();
      router.refresh();
    }
  }

  return (
    <PostcardDialog
      kind={card}
      title={title}
      teammates={teammates}
      workspaceGoals={workspaceGoals}
      writer={writer}
      defaultMessage={defaultMessage}
      open={open}
      onOpenChange={handleOpenChange}
      onSend={handleSend}
      onCloseAutoFocus={onCloseAutoFocus}
    />
  );
}
