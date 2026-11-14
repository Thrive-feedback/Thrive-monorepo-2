'use client';

import { PlusIcon } from 'lucide-react';
import { useRef } from 'react';
import {
  COMPOSE_CHOICE_TITLES,
  type ComposeChoice,
} from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import {
  ComposeCards,
  useComposeCards,
  warmComposeCards,
} from './compose-cards';

/** Each choice pointed at, in the colour of the card it writes. */
const CHOICE_HIGHLIGHTS: Readonly<Record<ComposeChoice, string>> = {
  ask: 'data-highlighted:bg-action-tertiary-surface',
  give: 'data-highlighted:bg-action-primary-surface',
  kudos: 'data-highlighted:bg-action-secondary-surface',
};

/** The mark beside each choice, so its colour is learnt before the card opens. */
const CHOICE_DOTS: Readonly<Record<ComposeChoice, string>> = {
  ask: 'bg-action-tertiary',
  give: 'bg-action-primary',
  kudos: 'bg-action-secondary',
};

const CHOICES: readonly {
  title: string;
  description: string;
  /** The card it opens. */
  card: ComposeChoice;
}[] = [
  {
    title: COMPOSE_CHOICE_TITLES.ask,
    description: 'Ask teammates what they think.',
    card: 'ask',
  },
  {
    title: COMPOSE_CHOICE_TITLES.give,
    description: "Tell a teammate what you've seen.",
    card: 'give',
  },
  {
    title: COMPOSE_CHOICE_TITLES.kudos,
    description: 'Say well done in a few words.',
    card: 'kudos',
  },
];

/**
 * Where "+" stands. Either way it is the same outlined button keeping its own corners, the same as
 * the sidebar's items. In the sidebar it is a full-width bar and its menu drops below; in the
 * phone's tab bar it is a square in the middle, the size of the rail's, and its menu rises above
 * the bar.
 */
const PLACEMENTS = {
  sidebar: {
    // Its icon is centred and alone, so it needs no side padding, and fits the narrow rail too.
    button: 'w-full px-0',
    menu: { side: 'bottom', align: 'start' },
  },
  'tab-bar': {
    button: 'size-11 px-0',
    menu: { side: 'top', align: 'center' },
  },
} as const;

export type ComposeMenuProps = {
  /** The Workspace the page was drawn for, which a card is sent to. */
  workspaceId: string;
  /** Who a postcard can be for, and who `@` offers on it. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
  /** Where "+" stands: the sidebar's full-width bar, or the square in the middle of the phone's tab bar. */
  placement?: keyof typeof PLACEMENTS;
};

/**
 * "+": the three things to write, each with a line on what it is for. Asking for feedback opens
 * the request postcard in front of the page, giving it the Feedback one, and giving Kudos the Kudos
 * card, each titled by the choice, and each is sent to the API with the card itself.
 */
export function ComposeMenu({
  workspaceId,
  teammates,
  workspaceGoals,
  writer,
  placement = 'sidebar',
}: ComposeMenuProps) {
  const { button, menu } = PLACEMENTS[placement];
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
          <Button ref={plusRef} className={button}>
            <PlusIcon aria-hidden="true" className="size-5" />
            <span className="sr-only">Write something</span>
          </Button>
        </DropdownMenuTrigger>
        {/* Its items' corners run parallel to its own: 6px in from a 9px corner, each item rounds by
            the 3px left, where the menu's usual 4px would leave them out of true. */}
        <DropdownMenuContent
          side={menu.side}
          align={menu.align}
          className="w-72 p-1.5"
          onCloseAutoFocus={handleMenuCloseAutoFocus}
        >
          {CHOICES.map(({ title, description, card }) => (
            <DropdownMenuItem
              key={title}
              className={cn(
                'flex-col items-start gap-0.5 px-3 py-2.5',
                CHOICE_HIGHLIGHTS[card],
              )}
              onSelect={() => handleChoose(card)}
            >
              <span className="flex items-center gap-2 text-fg-primary text-subtitle-4">
                <span
                  aria-hidden="true"
                  className={cn('size-2 rounded-full', CHOICE_DOTS[card])}
                />
                {title}
              </span>
              <span className="text-body-3 text-fg-secondary">
                {description}
              </span>
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
