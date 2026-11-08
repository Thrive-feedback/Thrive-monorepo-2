'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { ReadPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import { PostcardReadDialog } from '@/components/organisms/postcard-dialog/postcard-read-dialog';

export type FeedbackPostcardDialogProps = {
  title: string;
  /** Whoever the title names, whose face goes before it. */
  person?: PostcardWriter;
  card: ReadPostcard;
  answerIndex: number;
  /** Where closing it goes: the list it was opened from, as it was showing. */
  closeHref: string;
};

/**
 * The postcard a card in a list opened. It is open because the address says so, but it closes at
 * once rather than waiting for the navigation that takes that away, which reads the list again first.
 * What it remembers is the card it closed, so pressing that card again meanwhile, which brings a
 * fresh read, opens it rather than finding it shut.
 */
export function FeedbackPostcardDialog({
  title,
  person,
  card,
  answerIndex,
  closeHref,
}: FeedbackPostcardDialogProps) {
  const router = useRouter();
  const [closedCard, setClosedCard] = useState<ReadPostcard | null>(null);

  return (
    <PostcardReadDialog
      open={closedCard !== card}
      title={title}
      person={person}
      card={card}
      initialAnswerIndex={answerIndex}
      onOpenChange={(open) => {
        if (!open) {
          setClosedCard(card);
          router.replace(closeHref, { scroll: false });
        }
      }}
    />
  );
}
