'use client';

import { PlusIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  COMPOSE_CHOICE_TONES,
  COMPOSE_CHOICES,
  type ComposeChoice,
  WRITE_SOMETHING,
} from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import { Button } from '@/components/atoms/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/atoms/drawer';
import { FEED_CARD_POINTED } from '@/components/organisms/feed-card/feed-card-tone.constant';
import { cn } from '@/lib/cn.util';
import {
  ComposeCards,
  useComposeCards,
  warmComposeCards,
} from './compose-cards';
import { ComposeChoiceWords, type ComposeProps } from './compose-choice-words';

export type ComposeDrawerProps = ComposeProps;

/**
 * "+" in a phone's navbar, beside the bell: the same three choices, in a sheet that rises from the
 * bottom as the phone's other sheets do, titled Write something. It is the outlined button again, a
 * square the height of the bar's other buttons. A choice puts the sheet away and opens its card once
 * the sheet has gone, so the two never pull focus from each other; the card gives focus back to "+".
 */
export function ComposeDrawer({
  workspaceId,
  teammates,
  workspaceGoals,
  writer,
}: ComposeDrawerProps) {
  const { openCard, cards } = useComposeCards();
  const plusRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const chosen = useRef<ComposeChoice | null>(null);

  function handleOpenChange(isOpening: boolean) {
    setIsOpen(isOpening);
    if (isOpening) {
      warmComposeCards();
    }
  }

  function handleOpenChangeComplete(isNowOpen: boolean) {
    const card = chosen.current;
    if (!isNowOpen && card) {
      chosen.current = null;
      openCard(card);
    }
  }

  function handlePostcardCloseAutoFocus(event: Event) {
    event.preventDefault();
    plusRef.current?.focus();
  }

  return (
    <>
      <Drawer
        open={isOpen}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
      >
        <DrawerTrigger asChild>
          <Button ref={plusRef} className="size-9 px-0">
            <PlusIcon aria-hidden="true" className="size-5" />
            <span className="sr-only">{WRITE_SOMETHING}</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{WRITE_SOMETHING}</DrawerTitle>
          </DrawerHeader>
          <ul className="-mx-3 flex flex-col gap-1">
            {COMPOSE_CHOICES.map((card) => (
              <li key={card}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-button px-3 py-2.5 text-left transition-colors motion-reduce:transition-none',
                    FEED_CARD_POINTED[COMPOSE_CHOICE_TONES[card]],
                  )}
                  onClick={() => {
                    chosen.current = card;
                    setIsOpen(false);
                  }}
                >
                  <ComposeChoiceWords card={card} />
                </button>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
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
