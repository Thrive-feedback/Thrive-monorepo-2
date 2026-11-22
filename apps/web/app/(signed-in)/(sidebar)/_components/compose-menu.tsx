'use client';

import { PlusIcon } from 'lucide-react';
import { useRef } from 'react';
import {
  COMPOSE_CHOICE_TONES,
  COMPOSE_CHOICES,
  type ComposeChoice,
  WRITE_SOMETHING,
} from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { FEED_CARD_HIGHLIGHT } from '@/components/organisms/feed-card/feed-card-tone.constant';
import { cn } from '@/lib/cn.util';
import {
  ComposeCards,
  useComposeCards,
  warmComposeCards,
} from './compose-cards';
import { ComposeChoiceWords, type ComposeProps } from './compose-choice-words';

export type ComposeMenuProps = ComposeProps;

/**
 * "+" in the sidebar: the three things to write, each with a line on what it is for. Asking for
 * feedback opens the request postcard in front of the page, giving it the Feedback one, and giving
 * Kudos the Kudos card, each titled by the choice, and each is sent to the API with the card itself.
 * It is the same outlined button as the sidebar's items, keeping its own corners, a full-width bar
 * reading "+ write", all lowercase, which folds to its icon alone, centred, on the narrow rail; its
 * menu drops below.
 */
export function ComposeMenu({
  workspaceId,
  teammates,
  workspaceGoals,
  writer,
}: ComposeMenuProps) {
  const { openCard, cards } = useComposeCards();
  const plusRef = useRef<HTMLButtonElement>(null);
  const isOpeningCard = useRef(false);

  function handleChoose(card: ComposeChoice) {
    isOpeningCard.current = true;
    openCard(card);
  }

  // A menu sends focus back to "+" as it closes, which would pull it out of the postcard opening
  // in its place; the postcard puts it on the card itself.
  function handleMenuCloseAutoFocus(event: Event) {
    if (isOpeningCard.current) {
      event.preventDefault();
      isOpeningCard.current = false;
    }
  }

  // The postcard opens from the menu rather than from a `DialogTrigger`, and the menu item is
  // gone by the time it closes, so Radix has nowhere to send focus back to: it goes to "+".
  function handlePostcardCloseAutoFocus(event: Event) {
    event.preventDefault();
    plusRef.current?.focus();
  }

  return (
    <>
      <DropdownMenu
        onOpenChange={(isMenuOpen) => {
          if (isMenuOpen) {
            warmComposeCards();
          }
        }}
      >
        {/* The trigger rounds whatever it wraps into a pill; "+" keeps the button's own corners. */}
        <DropdownMenuTrigger asChild className="rounded-button">
          <Button ref={plusRef} className="w-full px-0">
            <PlusIcon aria-hidden="true" className="size-5" />
            {/* Its word shows while the sidebar is wide; the full name is what a screen reader hears. */}
            <span aria-hidden="true" className="rail:hidden">
              write
            </span>
            <span className="sr-only">{WRITE_SOMETHING}</span>
          </Button>
        </DropdownMenuTrigger>
        {/* Its items' corners run parallel to its own: 6px in from a 9px corner, each item rounds by
            the 3px left, where the menu's usual 4px would leave them out of true. */}
        <DropdownMenuContent
          side="bottom"
          align="start"
          className="w-72 p-1.5"
          onCloseAutoFocus={handleMenuCloseAutoFocus}
        >
          {COMPOSE_CHOICES.map((card) => (
            <DropdownMenuItem
              key={card}
              className={cn(
                'flex-col items-start gap-0.5 px-3 py-2.5',
                // Pointed at, in the colour of the card it writes, as every kind-coloured line is.
                FEED_CARD_HIGHLIGHT[COMPOSE_CHOICE_TONES[card]],
              )}
              onSelect={() => handleChoose(card)}
            >
              <ComposeChoiceWords card={card} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ComposeCards
        cards={cards}
        workspaceId={workspaceId}
        teammates={teammates}
        workspaceGoals={workspaceGoals}
        writer={writer}
        onCloseAutoFocus={handlePostcardCloseAutoFocus}
      />
    </>
  );
}
