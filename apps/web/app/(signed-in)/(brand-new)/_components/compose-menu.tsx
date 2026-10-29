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
  /** Whether it opens the postcard; Kudos is not built yet. */
  opensPostcard: boolean;
}[] = [
  {
    title: 'Ask for feedback',
    description: 'Ask teammates what they think.',
    opensPostcard: true,
  },
  {
    title: 'Give feedback',
    description: "Tell a teammate what you've seen.",
    opensPostcard: true,
  },
  {
    title: 'Give kudos',
    description: 'Say well done in a few words.',
    opensPostcard: false,
  },
];

export type ComposeMenuProps = {
  /** Who a postcard can be for. */
  teammates: readonly Teammate[];
  writer: PostcardWriter;
};

/**
 * "+": the three things to write, each with a line on what it is for. Asking for or giving
 * feedback opens the postcard in front of the page, titled by the choice; asking has no card of
 * its own yet, so it is written on the same one. Kudos is not built yet, so choosing it only
 * closes the menu.
 */
export function ComposeMenu({ teammates, writer }: ComposeMenuProps) {
  const [title, setTitle] = useState('Give feedback');
  const [isOpen, setIsOpen] = useState(false);
  const plusRef = useRef<HTMLButtonElement>(null);
  const isOpeningPostcard = useRef(false);

  function handleChoose(choice: string) {
    isOpeningPostcard.current = true;
    setTitle(choice);
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
    toast.success('Feedback sent.', {
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
          {CHOICES.map(({ title: choice, description, opensPostcard }) => (
            <DropdownMenuItem
              key={choice}
              className="flex-col items-start gap-0.5 px-3 py-2.5"
              onSelect={opensPostcard ? () => handleChoose(choice) : undefined}
            >
              <span className="text-fg-primary text-subtitle-4">{choice}</span>
              <span className="text-body-3 text-fg-secondary">
                {description}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <PostcardDialog
        title={title}
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
