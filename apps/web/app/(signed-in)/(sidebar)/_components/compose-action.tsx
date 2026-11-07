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
  /** The card this button offers to write. */
  choice: ComposeChoice;
  /** The Workspace the page was drawn for, which a card is sent to. */
  workspaceId: string;
  /** Who a card can be for, and who `@` offers on it. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
  /**
   * The page's title, which focus goes to once a card is sent, where this button goes with what it
   * stood in for, as in an empty list. Left out where the button stays, and focus comes back to it.
   * Every button in an empty list must pass it: one that leaves it out would drop focus to the page
   * when it goes.
   */
  returnFocusTo?: string;
};

/**
 * One card to write, offered in that card's colour and opened in front of the page: in an empty list,
 * where there may be one or two of these, or at the head of the Kudos board. Sending it reads the
 * page again, which now holds the card; focus then goes to the page's title where the button goes,
 * as it does when an answered card leaves Waiting for me, and otherwise back to the button.
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
    if (hasSent.current && returnFocusTo !== undefined) {
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
