'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/atoms/dialog';
import { GiverToReceivers } from '@/components/organisms/giver-to-receivers';
import {
  CardNotesButton,
  CardNotesContext,
  useCardNotes,
} from '@/components/organisms/postcard-dialog/card-notes';
import { CardToolNote } from '@/components/organisms/postcard-dialog/card-tool-note';
import { CARD_NOTES } from '@/components/organisms/postcard-dialog/card-tool-note.constant';
import postcardStyles from '@/components/organisms/postcard-dialog/postcard.module.css';
import type { PostcardSide } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import {
  CARD_NOTE_ARROW_LEFT,
  CARD_NOTE_BY_HIDE_BUTTON,
  POSTCARD_CARD_ACTIONS,
  POSTCARD_PAGE,
  POSTCARD_SCREEN,
} from '@/components/organisms/postcard-dialog/postcard-editor.constant';
import { PostcardHideButton } from '@/components/organisms/postcard-dialog/postcard-hide-button';
import { PostcardTitleRow } from '@/components/organisms/postcard-dialog/postcard-title-row';
import { PostcardTurnButton } from '@/components/organisms/postcard-dialog/postcard-turn-button';
import { usePostcardOpener } from '@/components/organisms/postcard-dialog/use-postcard-opener';
import { kudosCardDate } from './kudos-card.util';
import { KudosCardReadOnly } from './kudos-card-read-only';
import type { ReadKudos } from './read-kudos.type';

const NO_NAME = 'a teammate';

export type KudosCardReadDialogProps = {
  kudos: ReadKudos;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * A Kudos card that has been sent, in front of the page at the size it was written at, with who gave
 * it to whom under it. It can be turned over, and its stickers cleared away to read what lies under
 * them. Writing one is `KudosDialog`.
 *
 * Nothing can be lost, so Close and Escape close it at once.
 */
export function KudosCardReadDialog({
  kudos,
  open,
  onOpenChange,
}: KudosCardReadDialogProps) {
  const { noteOpener, handleCloseAutoFocus } = usePostcardOpener();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hasCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={noteOpener}
        onCloseAutoFocus={handleCloseAutoFocus}
        overlayClassName={postcardStyles.scrim}
        className={POSTCARD_SCREEN}
      >
        <KudosCardReadView kudos={kudos} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

type KudosCardReadViewProps = {
  kudos: ReadKudos;
  onClose: () => void;
};

/**
 * One opening of the dialog. It lives inside the dialog's content, which goes when the dialog
 * closes, so every opening starts on the front with its stickers on.
 */
function KudosCardReadView({ kudos, onClose }: KudosCardReadViewProps) {
  const [side, setSide] = useState<PostcardSide>('front');
  const [areStickersHidden, setAreStickersHidden] = useState(false);
  const { areNotesShown, handleToggleNotes } = useCardNotes();
  const hasStickers = kudos.drawing.stickers.length > 0;

  return (
    <CardNotesContext value={areNotesShown}>
      <div className={POSTCARD_PAGE}>
        <PostcardTitleRow
          title={`Kudos from ${kudos.giver.name ?? NO_NAME}`}
          onClose={onClose}
          className="max-w-90"
        />

        <div className="relative flex w-full max-w-90 flex-col gap-3">
          <div className={POSTCARD_CARD_ACTIONS}>
            <PostcardTurnButton
              side={side}
              turnToBackHint="Turn over to see the day it was given"
              toFrontLabel="Turn over to the front, the words"
              toBackLabel="Turn over to the back, the date"
              onClick={() =>
                setSide((current) => (current === 'back' ? 'front' : 'back'))
              }
            />
            {hasStickers && (
              <CardToolNote
                className={CARD_NOTE_BY_HIDE_BUTTON}
                arrowClassName={CARD_NOTE_ARROW_LEFT}
              >
                {areStickersHidden
                  ? CARD_NOTES.showStickers
                  : CARD_NOTES.hideStickers}
              </CardToolNote>
            )}
            <PostcardHideButton
              isHidden={areStickersHidden}
              what="stickers"
              disabled={!hasStickers || side === 'back'}
              onClick={() => setAreStickersHidden((current) => !current)}
            />
            <CardNotesButton
              areNotesShown={areNotesShown}
              onClick={handleToggleNotes}
            />
          </div>
          <KudosCardReadOnly
            message={kudos.message}
            tags={kudos.messageTags}
            drawing={kudos.drawing}
            date={kudosCardDate(kudos.givenAt)}
            side={side}
            areStickersHidden={areStickersHidden}
          />
          <div className="flex w-fit max-w-full self-center rounded-control bg-surface-raised px-3 py-2 shadow-low">
            <GiverToReceivers
              giver={kudos.giver}
              receivers={kudos.recipients}
              kind="Kudos"
              hasAccentedTo
            />
          </div>
        </div>
      </div>
    </CardNotesContext>
  );
}
