'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ComposeCards,
  useComposeCards,
  warmComposeCards,
} from '@/app/(signed-in)/(sidebar)/_components/compose-cards';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { FeedComposer } from './feed-composer/feed-composer';

/** On a touch screen, focus brings up the keyboard, which would cover the page on arrival. */
const TOUCH_SCREEN = '(pointer: coarse)';

export type HomeComposerPanelProps = {
  /** The Workspace the page was drawn for, which a card is sent to. */
  workspaceId: string;
  teammates: readonly Teammate[];
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
  /** A postcard is open over Home as it is reached, which keeps the cursor. Read once. */
  isUnderPostcard?: boolean;
};

/**
 * The composer at the head of Home and the postcard it opens. Reaching Home puts the cursor in the
 * field, ready to write. What was typed stays there until a card goes, so closing the postcard
 * without sending loses nothing here.
 */
export function HomeComposerPanel({
  workspaceId,
  teammates,
  workspaceGoals,
  writer,
  isUnderPostcard = false,
}: HomeComposerPanelProps) {
  const [message, setMessage] = useState('');
  const [wasUnderPostcard] = useState(isUnderPostcard);
  const { openCard, cards } = useComposeCards();
  const fieldRef = useRef<HTMLInputElement>(null);
  const hasWarmedCards = useRef(false);

  useEffect(() => {
    const isTouchScreen =
      typeof matchMedia === 'function' && matchMedia(TOUCH_SCREEN).matches;
    if (!wasUnderPostcard && !isTouchScreen) {
      fieldRef.current?.focus();
    }
  }, [wasUnderPostcard]);

  function handleMessageChange(typed: string) {
    setMessage(typed);
    if (!hasWarmedCards.current) {
      hasWarmedCards.current = true;
      warmComposeCards();
    }
  }

  const handleSent = useCallback(() => setMessage(''), []);

  // The postcard opens from a button rather than a `DialogTrigger`, so Radix has nowhere to send
  // focus back to: it goes to the field, ready for the next thing to write.
  const handleCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    fieldRef.current?.focus();
  }, []);

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
        // A card reads this as its editor mounts, which on a first opening is once its code has
        // arrived, so it stays live while a card is open. Closed, it stays blank and typing
        // leaves the cards alone.
        defaultMessage={
          cards.isPostcardOpen || cards.isKudosOpen ? message : ''
        }
        onSent={handleSent}
        onCloseAutoFocus={handleCloseAutoFocus}
      />
    </>
  );
}
