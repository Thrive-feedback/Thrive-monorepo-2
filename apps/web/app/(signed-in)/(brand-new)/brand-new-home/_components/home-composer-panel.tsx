'use client';

import { useRef, useState } from 'react';
import {
  ComposeCards,
  useComposeCards,
  warmComposeCards,
} from '@/app/(signed-in)/(brand-new)/_components/compose-cards';
import { FeedComposer } from '@/components/organisms/feed-composer/feed-composer';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';

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
  const { openCard, cards } = useComposeCards();
  const fieldRef = useRef<HTMLInputElement>(null);
  const hasWarmedCards = useRef(false);

  function handleMessageChange(typed: string) {
    setMessage(typed);
    if (!hasWarmedCards.current) {
      hasWarmedCards.current = true;
      warmComposeCards();
    }
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
        onChoose={openCard}
      />
      <ComposeCards
        cards={cards}
        workspaceId={workspaceId}
        teammates={teammates}
        workspaceGoals={workspaceGoals}
        writer={writer}
        defaultMessage={message}
        onSent={() => setMessage('')}
        onCloseAutoFocus={handleCloseAutoFocus}
      />
    </>
  );
}
