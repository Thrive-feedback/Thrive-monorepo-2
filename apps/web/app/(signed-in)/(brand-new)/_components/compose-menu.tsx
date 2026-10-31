'use client';

import { PlusIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import {
  type ComposeCard,
  ComposePostcardDialog,
  warmPostcardDialog,
} from './compose-postcard-dialog';

const CHOICES: readonly {
  title: string;
  description: string;
  /** The postcard it opens; none, and it is not built yet. */
  card: ComposeCard | null;
}[] = [
  {
    title: 'Ask for feedback',
    description: 'Ask teammates what they think.',
    card: 'ask',
  },
  {
    title: 'Give feedback',
    description: "Tell a teammate what you've seen.",
    card: 'give',
  },
  {
    title: 'Give kudos',
    description: 'Say well done in a few words.',
    card: null,
  },
];

export type ComposeMenuProps = {
  /** The Workspace the page was drawn for, which a card is sent to. */
  workspaceId: string;
  /** Who a postcard can be for, and who `@` offers on it. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
};

/**
 * "+": the three things to write, each with a line on what it is for. Asking for feedback opens
 * the request postcard in front of the page, and giving it the Feedback one, each titled by the
 * choice, and either is sent to the API with the card itself. Kudos is not built yet, so choosing
 * it only closes the menu.
 */
export function ComposeMenu({
  workspaceId,
  teammates,
  workspaceGoals,
  writer,
}: ComposeMenuProps) {
  const [choice, setChoice] = useState<{ title: string; card: ComposeCard }>({
    title: 'Give feedback',
    card: 'give',
  });
  const [isOpen, setIsOpen] = useState(false);
  // Mounted from the first card on, so it is not drawn before anyone writes, and stays for its
  // closing motion after.
  const [hasOpenedPostcard, setHasOpenedPostcard] = useState(false);
  const plusRef = useRef<HTMLButtonElement>(null);
  const isOpeningPostcard = useRef(false);

  function handleChoose(title: string, card: ComposeCard) {
    isOpeningPostcard.current = true;
    setHasOpenedPostcard(true);
    setChoice({ title, card });
    setIsOpen(true);
  }

  // A menu sends focus back to "+" as it closes, which would pull it out of the postcard opening
  // in its place; the postcard puts it on the card itself.
  function handleMenuCloseAutoFocus(event: Event) {
    if (isOpeningPostcard.current) {
      event.preventDefault();
      isOpeningPostcard.current = false;
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
            warmPostcardDialog();
          }
        }}
      >
        {/* The trigger rounds whatever it wraps into a pill; this is a full-width bar, so it keeps
            the button's own corners, the same as the sidebar's items below it. */}
        <DropdownMenuTrigger asChild className="rounded-button">
          <Button ref={plusRef} variant="secondary" className="w-full">
            <PlusIcon aria-hidden="true" className="size-5" />
            <span className="sr-only">Write something</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-72"
          onCloseAutoFocus={handleMenuCloseAutoFocus}
        >
          {CHOICES.map(({ title, description, card }) => (
            <DropdownMenuItem
              key={title}
              className="flex-col items-start gap-0.5 px-3 py-2.5"
              onSelect={card ? () => handleChoose(title, card) : undefined}
            >
              <span className="text-fg-primary text-subtitle-4">{title}</span>
              <span className="text-body-3 text-fg-secondary">
                {description}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {hasOpenedPostcard && (
        <ComposePostcardDialog
          workspaceId={workspaceId}
          teammates={teammates}
          workspaceGoals={workspaceGoals}
          writer={writer}
          card={choice.card}
          title={choice.title}
          open={isOpen}
          onOpenChange={setIsOpen}
          onCloseAutoFocus={handlePostcardCloseAutoFocus}
        />
      )}
    </>
  );
}
