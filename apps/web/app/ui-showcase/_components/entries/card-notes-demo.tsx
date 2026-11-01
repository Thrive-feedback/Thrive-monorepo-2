'use client';

import { useState } from 'react';
import {
  CardNotesButton,
  CardNotesContext,
} from '@/components/organisms/postcard-dialog/card-notes';
import { CardToolNote } from '@/components/organisms/postcard-dialog/card-tool-note';
import { CARD_NOTES } from '@/components/organisms/postcard-dialog/card-tool-note.constant';

/** Client-only because the button is pressed here. Nothing is remembered: this state is its own. */
export function CardNotesDemo() {
  const [areNotesShown, setAreNotesShown] = useState(true);

  return (
    <CardNotesContext value={areNotesShown}>
      <div className="flex min-h-12 items-center gap-4">
        <CardNotesButton
          areNotesShown={areNotesShown}
          onClick={() => setAreNotesShown((current) => !current)}
        />
        <CardToolNote className="flex">{CARD_NOTES.chooseReaders}</CardToolNote>
      </div>
    </CardNotesContext>
  );
}
