'use client';

import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { deliverCard } from '@/app/(signed-in)/(brand-new)/_lib/deliver-card.util';
import { sendKudosCard } from '@/app/(signed-in)/(brand-new)/_lib/send-postcard-actions.service';
import { toSentKudos } from '@/app/(signed-in)/(brand-new)/_lib/sent-kudos.util';
import type { KudosDraft } from '@/components/organisms/kudos-dialog/kudos-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { ROUTES } from '@/lib/routes.constant';

/** The Kudos card, on the same terms as the postcard. */
const KudosDialog = dynamic(
  () =>
    import('@/components/organisms/kudos-dialog/kudos-dialog').then(
      (kudos) => kudos.KudosDialog,
    ),
  { ssr: false },
);

/** Fetches the card's code ahead of a choice; a failed fetch is retried when it is drawn. */
export function warmKudosDialog() {
  import('@/components/organisms/kudos-dialog/kudos-dialog').catch(() => {});
}

const COULD_NOT_SEND = "We couldn't send your Kudos. Please try again.";

export type ComposeKudosDialogProps = {
  /** The Workspace the page was drawn for, which the Kudos is sent to. */
  workspaceId: string;
  /** Who `@` offers, which is who it can be for. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  /** What is already written as it opens, as typed before choosing this card. */
  defaultMessage?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The Kudos went, and the Giver has left the board. */
  onSent?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * A Kudos card, sent to the API with the card itself. Once the Giver leaves the board the page
 * reads again, so it is up to date with what they sent.
 */
export function ComposeKudosDialog({
  workspaceId,
  teammates,
  workspaceGoals,
  defaultMessage,
  open,
  onOpenChange,
  onSent,
  onCloseAutoFocus,
}: ComposeKudosDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasSent = useRef(false);

  async function handleSend(kudos: KudosDraft) {
    const hasGone = await deliverCard(
      () => sendKudosCard(workspaceId, toSentKudos(kudos)),
      'Kudos sent.',
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

  function handleGoToBoard() {
    handleOpenChange(false);
    router.push(ROUTES.brandNewKudos);
  }

  // The dialog can be opened from anywhere the sidebar is. On Home itself going back is closing it,
  // which keeps its filter.
  function handleBackToHome() {
    handleOpenChange(false);
    if (pathname !== ROUTES.brandNewHome) {
      router.push(ROUTES.brandNewHome);
    }
  }

  return (
    <KudosDialog
      teammates={teammates}
      workspaceGoals={workspaceGoals}
      defaultMessage={defaultMessage}
      open={open}
      onOpenChange={handleOpenChange}
      onSend={handleSend}
      onGoToBoard={handleGoToBoard}
      onBackToHome={handleBackToHome}
      onCloseAutoFocus={onCloseAutoFocus}
    />
  );
}
