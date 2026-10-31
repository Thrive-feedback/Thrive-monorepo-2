'use client';

import { useRef, useState } from 'react';
import {
  ComposePostcardDialog,
  warmPostcardDialog,
} from '@/app/(signed-in)/(brand-new)/_components/compose-postcard-dialog';
import {
  FeedComposer,
  type FeedComposerChoice,
} from '@/components/organisms/feed-composer';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';

const TITLES: Readonly<Record<FeedComposerChoice, string>> = {
  ask: 'Ask for feedback',
  give: 'Give feedback',
};

export type HomeComposerPanelProps = {
  /** The Workspace the page was drawn for, which a card is sent to. */
  workspaceId: string;
  teammates: readonly Teammate[];
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
};

/**
 * The composer at the head of Home and the postcard it opens. What was typed stays in the field
 * until a card goes, so closing the postcard without sending loses nothing here.
 */
export function HomeComposerPanel({
  workspaceId,
  teammates,
  workspaceGoals,
  writer,
}: HomeComposerPanelProps) {
  const [message, setMessage] = useState('');
  const [choice, setChoice] = useState<FeedComposerChoice>('give');
  const [isOpen, setIsOpen] = useState(false);
  // Mounted from the first card on, so it is not drawn before anyone writes, and stays for its
  // closing motion after.
  const [hasOpened, setHasOpened] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);

  function handleChoose(chosen: FeedComposerChoice) {
    setChoice(chosen);
    setHasOpened(true);
    setIsOpen(true);
  }

  function handleMessageChange(typed: string) {
    setMessage(typed);
    warmPostcardDialog();
  }

  // The postcard opens from a button rather than a `DialogTrigger`, so Radix has nowhere to send
  // focus back to: it goes to the field, ready for the next thing to write.
  function handleCloseAutoFocus(event: Event) {
    event.preventDefault();
    fieldRef.current?.focus();
  }

  return (
    <>
      <FeedComposer
        ref={fieldRef}
        writer={writer}
        teammates={teammates}
        workspaceGoals={workspaceGoals}
        message={message}
        onMessageChange={handleMessageChange}
        onChoose={handleChoose}
      />
      {hasOpened && (
        <ComposePostcardDialog
          workspaceId={workspaceId}
          teammates={teammates}
          workspaceGoals={workspaceGoals}
          writer={writer}
          card={choice}
          title={TITLES[choice]}
          defaultMessage={message}
          open={isOpen}
          onOpenChange={setIsOpen}
          onSent={() => setMessage('')}
          onCloseAutoFocus={handleCloseAutoFocus}
        />
      )}
    </>
  );
}
