'use client';

import { useState } from 'react';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { ComposeKudosDialog, warmKudosDialog } from './compose-kudos-dialog';
import {
  type ComposeCard,
  ComposePostcardDialog,
  warmPostcardDialog,
} from './compose-postcard-dialog';

/** What a person can choose to write. */
export type ComposeChoice = ComposeCard | 'kudos';

export const COMPOSE_CARD_TITLES: Readonly<Record<ComposeCard, string>> = {
  ask: 'Ask for feedback',
  give: 'Give feedback',
};

/** Fetches the cards' code ahead of a choice. */
export function warmComposeCards() {
  warmPostcardDialog();
  warmKudosDialog();
}

/**
 * Which card is open. Each is mounted from its first opening on, so it is not drawn before anyone
 * writes, and stays for its closing motion after.
 */
export function useComposeCards() {
  const [postcard, setPostcard] = useState<ComposeCard>('give');
  const [isPostcardOpen, setIsPostcardOpen] = useState(false);
  const [isKudosOpen, setIsKudosOpen] = useState(false);
  const [hasOpenedPostcard, setHasOpenedPostcard] = useState(false);
  const [hasOpenedKudos, setHasOpenedKudos] = useState(false);

  function openCard(choice: ComposeChoice) {
    if (choice === 'kudos') {
      setHasOpenedKudos(true);
      setIsKudosOpen(true);
      return;
    }
    setPostcard(choice);
    setHasOpenedPostcard(true);
    setIsPostcardOpen(true);
  }

  return {
    openCard,
    cards: {
      postcard,
      isPostcardOpen,
      setIsPostcardOpen,
      isKudosOpen,
      setIsKudosOpen,
      hasOpenedPostcard,
      hasOpenedKudos,
    },
  };
}

export type ComposeCardsProps = {
  cards: ReturnType<typeof useComposeCards>['cards'];
  /** The Workspace the page was drawn for, which a card is sent to. */
  workspaceId: string;
  /** Who a card can be for, and who `@` offers on it. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
  /** What is already written as a card opens, as typed before choosing it. */
  defaultMessage?: string;
  /** A card went, and is out of the way. */
  onSent?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

/** The postcard and the Kudos card, in front of whatever chose them. */
export function ComposeCards({
  cards,
  workspaceId,
  teammates,
  workspaceGoals,
  writer,
  defaultMessage,
  onSent,
  onCloseAutoFocus,
}: ComposeCardsProps) {
  return (
    <>
      {cards.hasOpenedPostcard && (
        <ComposePostcardDialog
          workspaceId={workspaceId}
          teammates={teammates}
          workspaceGoals={workspaceGoals}
          writer={writer}
          card={cards.postcard}
          title={COMPOSE_CARD_TITLES[cards.postcard]}
          defaultMessage={defaultMessage}
          open={cards.isPostcardOpen}
          onOpenChange={cards.setIsPostcardOpen}
          onSent={onSent}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
      {cards.hasOpenedKudos && (
        <ComposeKudosDialog
          workspaceId={workspaceId}
          teammates={teammates}
          workspaceGoals={workspaceGoals}
          defaultMessage={defaultMessage}
          open={cards.isKudosOpen}
          onOpenChange={cards.setIsKudosOpen}
          onSent={onSent}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
    </>
  );
}
