'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReadPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import { PostcardReadDialog } from '@/components/organisms/postcard-dialog/postcard-read-dialog';

export type HomePostcardDialogProps = {
  title: string;
  card: ReadPostcard;
  answerIndex: number;
  /** Where closing it goes: Home under the filter it was opened from. */
  closeHref: string;
};

/**
 * The postcard a card on Home opened. It is open because the address says so, but it closes at once
 * rather than waiting for the navigation that takes that away, which reads the feed again first.
 * What it remembers is the card it closed, so pressing that card again meanwhile, which brings a
 * fresh read, opens it rather than finding it shut.
 */
export function HomePostcardDialog({
  title,
  card,
  answerIndex,
  closeHref,
}: HomePostcardDialogProps) {
  const router = useRouter();
  const [closedCard, setClosedCard] = useState<ReadPostcard | null>(null);

  return (
    <PostcardReadDialog
      open={closedCard !== card}
      title={title}
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
