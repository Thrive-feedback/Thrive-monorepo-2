'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ComposeCards,
  useComposeCards,
  warmComposeCards,
} from '@/app/(signed-in)/(sidebar)/_components/compose-cards';
import {
  COMPOSE_CHOICE_OUTLINES,
  type ComposeChoice,
  PERSON_COMPOSE_ACTIONS,
  PERSON_COMPOSE_CHOICES,
} from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import { Button } from '@/components/atoms/button';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';

export type ProfileComposeActionsProps = {
  /** Whose Profile it is, who each card opens for. */
  teammate: Teammate;
  /** Everyone but the reader: who a card can be for, and who `@` offers on it. */
  teammates: readonly Teammate[];
  /** The Workspace the page was drawn for, which a card is sent to. */
  workspaceId: string;
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
};

/**
 * Give, Ask and Kudos for the person whose Profile it is, each in the colour of the card it opens,
 * as their row in Teammates offers them: the postcard with them as who it is for or who is asked,
 * the Kudos with their @mention written. Closing a card gives focus back to the button it came from.
 */
export function ProfileComposeActions({
  teammate,
  teammates,
  workspaceId,
  workspaceGoals,
  writer,
}: ProfileComposeActionsProps) {
  const [choice, setChoice] = useState<ComposeChoice | null>(null);
  const openedFrom = useRef<HTMLButtonElement | null>(null);
  const { openCard, cards } = useComposeCards();
  // Held still between renders, because the cards are memoised on what they are given.
  const recipientAccountIds = useMemo(
    () => (choice === 'kudos' ? undefined : [teammate.accountId]),
    [choice, teammate.accountId],
  );

  function handleChoose(chosen: ComposeChoice, from: HTMLButtonElement) {
    openedFrom.current = from;
    setChoice(chosen);
    openCard(chosen);
  }

  // The card opened from a button here, not from a `DialogTrigger`, so Radix has nowhere to send
  // focus back to.
  const handleCardCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    if (openedFrom.current?.isConnected) {
      openedFrom.current.focus();
    }
  }, []);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 md:flex">
        {PERSON_COMPOSE_CHOICES.map((each) => {
          const { word, name } = PERSON_COMPOSE_ACTIONS[each];
          return (
            <Button
              key={each}
              variant={COMPOSE_CHOICE_OUTLINES[each]}
              size="sm"
              aria-label={name(teammate.name)}
              // Warmed as the person reaches for it, so the card is ready by the press.
              onPointerEnter={warmComposeCards}
              onFocus={warmComposeCards}
              onClick={(event) => handleChoose(each, event.currentTarget)}
            >
              {word}
            </Button>
          );
        })}
      </div>
      <ComposeCards
        cards={cards}
        workspaceId={workspaceId}
        teammates={teammates}
        workspaceGoals={workspaceGoals}
        writer={writer}
        defaultRecipientAccountIds={recipientAccountIds}
        defaultMessage={
          choice === 'kudos' && teammate.slug !== null
            ? `@${teammate.slug} `
            : undefined
        }
        onCloseAutoFocus={handleCardCloseAutoFocus}
      />
    </>
  );
}
