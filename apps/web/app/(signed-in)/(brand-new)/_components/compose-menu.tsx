'use client';

import { PlusIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { unstable_rethrow } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  sendPostcardFeedback,
  sendPostcardRequest,
} from '@/app/(signed-in)/(brand-new)/_lib/send-postcard-actions.service';
import { toSentPostcard } from '@/app/(signed-in)/(brand-new)/_lib/sent-postcard.util';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import type {
  PostcardDraft,
  PostcardWriter,
} from '@/components/organisms/postcard-dialog/postcard-draft.type';
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

/**
 * The postcard is the heaviest thing on the page and nobody needs it until they choose to write,
 * so its code arrives on its own, warmed as soon as the menu opens.
 */
const PostcardDialog = dynamic(
  () =>
    import('@/components/organisms/postcard-dialog/postcard-dialog').then(
      (postcard) => postcard.PostcardDialog,
    ),
  { ssr: false },
);

/** Fetches the postcard's code ahead of a choice; a failed fetch is retried when it is drawn. */
function warmPostcardDialog() {
  import('@/components/organisms/postcard-dialog/postcard-dialog').catch(
    () => {},
  );
}

/** What a sent card is called in the toast that says it went. */
const SENT: Readonly<Record<'give' | 'ask', string>> = {
  give: 'Feedback sent.',
  ask: 'Request sent.',
};

const COULD_NOT_SEND = "We couldn't send your postcard. Please try again.";

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
  const [choice, setChoice] = useState<{ title: string; card: 'give' | 'ask' }>(
    { title: 'Give feedback', card: 'give' },
  );
  const [isOpen, setIsOpen] = useState(false);
  // Mounted from the first card on, so it is not drawn before anyone writes, and stays for its
  // closing motion after.
  const [hasOpenedPostcard, setHasOpenedPostcard] = useState(false);
  const plusRef = useRef<HTMLButtonElement>(null);
  const isOpeningPostcard = useRef(false);

  function handleChoose(title: string, card: 'give' | 'ask') {
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

  // Whether it went decides what the card does next: a card that went flies off, and one that did
  // not stays open with everything on it.
  async function handleSend(postcard: PostcardDraft) {
    const send =
      choice.card === 'give' ? sendPostcardFeedback : sendPostcardRequest;
    try {
      const { formError } = await send(workspaceId, toSentPostcard(postcard));
      if (formError) {
        toast.error(formError);
        return false;
      }
    } catch (error) {
      // Being signed out rejects the action with a redirect, which is not a send that failed.
      unstable_rethrow(error);
      toast.error(COULD_NOT_SEND);
      return false;
    }
    toast.success(SENT[choice.card]);
    return true;
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
        <PostcardDialog
          kind={choice.card}
          title={choice.title}
          teammates={teammates}
          workspaceGoals={workspaceGoals}
          writer={writer}
          open={isOpen}
          onOpenChange={setIsOpen}
          onSend={handleSend}
          onCloseAutoFocus={handlePostcardCloseAutoFocus}
        />
      )}
    </>
  );
}
