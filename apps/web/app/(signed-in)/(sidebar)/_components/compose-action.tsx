'use client';

import { useRef } from 'react';
import {
  COMPOSE_CHOICE_BUTTONS,
  COMPOSE_CHOICE_TITLES,
  type ComposeChoice,
} from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import { Button } from '@/components/atoms/button';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import {
  ComposeCards,
  useComposeCards,
  warmComposeCards,
} from './compose-cards';

export type ComposeActionProps = {
  /** The card that fills the list this button stands in for. */
  choice: ComposeChoice;
  /** The Workspace the page was drawn for, which a card is sent to. */
  workspaceId: string;
  /** Who a card can be for, and who `@` offers on it. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
  /** The page's title, which focus goes to once a card is sent, because this button is about to go. */
  returnFocusTo: string;
};

/**
 * The one card an empty list offers to write, in that card's colour, opening it in front of the
 * page. Sending it reads the page again, which now holds it, so the button goes with the empty list;
 * focus then goes to the page's title, as it does when an answered card leaves Waiting for me.
 */
export function ComposeAction({
  choice,
  workspaceId,
  teammates,
  workspaceGoals,
  writer,
  returnFocusTo,
}: ComposeActionProps) {
  const { openCard, cards } = useComposeCards();
  const hasSent = useRef(false);

  function handleCloseAutoFocus(event: Event) {
    if (hasSent.current) {
      event.preventDefault();
      document.getElementById(returnFocusTo)?.focus({ preventScroll: true });
    }
  }

  return (
    <>
      <Button
        variant={COMPOSE_CHOICE_BUTTONS[choice]}
        onPointerEnter={warmComposeCards}
        onClick={() => openCard(choice)}
      >
        {COMPOSE_CHOICE_TITLES[choice]}
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
