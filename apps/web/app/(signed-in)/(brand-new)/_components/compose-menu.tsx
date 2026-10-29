'use client';

import { PlusIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { PostcardDialog } from '@/components/organisms/postcard-dialog/postcard-dialog';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';

const CHOICES: readonly {
  title: string;
  description: string;
  /** The postcard it opens; none, and it is not built yet. */
  card: 'give' | 'ask' | null;
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

/** What a sent card is called in the toast that says it went. */
const SENT: Readonly<Record<'give' | 'ask', string>> = {
  give: 'Feedback sent.',
  ask: 'Request sent.',
};

export type ComposeMenuProps = {
  /** Who a postcard can be for. */
  teammates: readonly Teammate[];
  writer: PostcardWriter;
};

/**
 * "+": the three things to write, each with a line on what it is for. Asking for feedback opens
 * the request postcard in front of the page, and giving it the Feedback one, each titled by the
 * choice. Kudos is not built yet, so choosing it only closes the menu.
 */
export function ComposeMenu({ teammates, writer }: ComposeMenuProps) {
  const [choice, setChoice] = useState<{ title: string; card: 'give' | 'ask' }>(
    { title: 'Give feedback', card: 'give' },
  );
  const [isOpen, setIsOpen] = useState(false);
  const plusRef = useRef<HTMLButtonElement>(null);
  const isOpeningPostcard = useRef(false);

  function handleChoose(title: string, card: 'give' | 'ask') {
    isOpeningPostcard.current = true;
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

  // Nothing is sent yet: the card has flown off, and the toast says this is a first look.
  function handleSend() {
    toast.success(SENT[choice.card], {
      description: 'This is a first look: nothing left this page.',
    });
  }

  // The postcard opens from the menu rather than from a `DialogTrigger`, and the menu item is
  // gone by the time it closes, so Radix has nowhere to send focus back to: it goes to "+".
  function handlePostcardCloseAutoFocus(event: Event) {
    event.preventDefault();
    plusRef.current?.focus();
  }

  return (
    <>
      <DropdownMenu>
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
      <PostcardDialog
        kind={choice.card}
        title={choice.title}
        teammates={teammates}
        writer={writer}
        open={isOpen}
        onOpenChange={setIsOpen}
        onSend={handleSend}
        onCloseAutoFocus={handlePostcardCloseAutoFocus}
      />
    </>
  );
}
