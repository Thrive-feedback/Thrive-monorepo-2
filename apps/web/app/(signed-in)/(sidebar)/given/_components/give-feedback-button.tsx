'use client';

import { useRef } from 'react';
import {
  ComposeCards,
  useComposeCards,
  warmComposeCards,
} from '@/app/(signed-in)/(sidebar)/_components/compose-cards';
import { GIVEN_HEADING_ID } from '@/app/(signed-in)/(sidebar)/_lib/personal-items-side.constant';
import { Button } from '@/components/atoms/button';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';

export type GiveFeedbackButtonProps = {
  /** The Workspace the page was drawn for, which the card is sent to. */
  workspaceId: string;
  /** Who the postcard can be for, and who `@` offers on it. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
};

/** Opens the postcard from an empty Given. Sending it reads the page again, which now holds it. */
export function GiveFeedbackButton({
  workspaceId,
  teammates,
  workspaceGoals,
  writer,
}: GiveFeedbackButtonProps) {
  const { openCard, cards } = useComposeCards();
  const hasSent = useRef(false);

  // The list takes this button's place once a card is sent, so focus has nowhere to go back to. It
  // goes to the title, as it does when an answered card leaves Waiting for me.
  function handleCloseAutoFocus(event: Event) {
    if (hasSent.current) {
      event.preventDefault();
      document.getElementById(GIVEN_HEADING_ID)?.focus({ preventScroll: true });
    }
  }

  return (
    <>
      <Button
        className="self-start"
        onPointerEnter={warmComposeCards}
        onClick={() => openCard('give')}
      >
        Give feedback
      </Button>
      <ComposeCards
        cards={cards}
        workspaceId={workspaceId}
        teammates={teammates}
        workspaceGoals={workspaceGoals}
        writer={writer}
        onSent={() => {
          hasSent.current = true;
        }}
        onCloseAutoFocus={handleCloseAutoFocus}
      />
    </>
  );
}
