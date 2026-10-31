'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/atoms/dialog';
import { cn } from '@/lib/cn.util';
import { Postcard } from './postcard';
import { PostcardAnswerPager } from './postcard-answer-pager';
import type { PostcardSide } from './postcard-draft.type';
import {
  POSTCARD_CARD_COLUMN,
  POSTCARD_PAGE,
  POSTCARD_SCREEN,
} from './postcard-editor.constant';
import { PostcardPostmarkStill } from './postcard-postmark-still';
import type { ReadPostcard } from './postcard-read.type';
import { PostcardAnsweredBack, PostcardGivenBack } from './postcard-read-back';
import {
  PostcardStampBoxReadOnly,
  PostcardStampReadOnly,
} from './postcard-stamp';
import { PostcardStickersReadOnly } from './postcard-sticker';
import { PostcardTitleRow } from './postcard-title-row';
import { PostcardTurnButton } from './postcard-turn-button';
import { usePostcardOpener } from './use-postcard-opener';

export type PostcardReadDialogProps = {
  /** What is being read, above the card: "Feedback from Ann". */
  title: string;
  card: ReadPostcard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * A postcard that has been sent, in front of the page, looking as it did when it was written, with
 * its postmark across the stamp and nothing left to change. Writing on one is `PostcardDialog`.
 *
 * - `give`: one full back, the message under who it is from and who it went to.
 * - `ask`: the back halved, the Ask on the left and one answer on the right, with a pager under the
 *   card when there is more than one.
 *
 * Nothing can be lost, so Close and Escape close it at once.
 */
export function PostcardReadDialog({
  title,
  card,
  open,
  onOpenChange,
}: PostcardReadDialogProps) {
  const { noteOpener, giveFocusBack } = usePostcardOpener();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hasCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={noteOpener}
        onCloseAutoFocus={giveFocusBack}
        className={POSTCARD_SCREEN}
      >
        <PostcardReadView
          title={title}
          card={card}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/** What differs by card once it is showing, with the answer chosen on a request. */
function showing(card: ReadPostcard, answerIndex: number) {
  if (card.kind === 'give') {
    return {
      look: card,
      sentOn: card.sentOn,
      back: <PostcardGivenBack card={card} />,
      shownIndex: 0,
      answerStickers: [],
      pager: null,
    };
  }

  // The answers can shrink under an open card, and the card and the pager must agree on which shows.
  const shownIndex = Math.min(answerIndex, card.answers.length - 1);
  const answer = card.answers[shownIndex] ?? card.answers[0];
  return {
    look: card.ask,
    sentOn: answer.sentOn,
    back: (
      <PostcardAnsweredBack
        card={card}
        answer={answer}
        answerIndex={shownIndex}
      />
    ),
    shownIndex,
    answerStickers: answer.stickers,
    pager:
      card.answers.length > 1
        ? {
            index: shownIndex,
            count: card.answers.length,
            giverName: answer.giver.name,
          }
        : null,
  };
}

type PostcardReadViewProps = {
  title: string;
  card: ReadPostcard;
  onClose: () => void;
};

/**
 * One opening of the dialog. It lives inside the dialog's content, which goes when the dialog
 * closes, so every opening starts on the back at the first answer.
 */
function PostcardReadView({ title, card, onClose }: PostcardReadViewProps) {
  const [side, setSide] = useState<PostcardSide>('back');
  const [answerIndex, setAnswerIndex] = useState(0);
  const { look, sentOn, back, shownIndex, answerStickers, pager } = showing(
    card,
    answerIndex,
  );

  // The card's own first, so a later sticker sits on an earlier one. An answer's are keyed by the
  // answer, so one never shows another's picture while the new one loads.
  function stickersOn(stickerSide: PostcardSide) {
    return (
      <>
        <PostcardStickersReadOnly stickers={look.stickers} side={stickerSide} />
        <PostcardStickersReadOnly
          key={shownIndex}
          stickers={answerStickers}
          side={stickerSide}
        />
      </>
    );
  }

  return (
    <div className={POSTCARD_PAGE}>
      <PostcardTitleRow title={title} onClose={onClose} />

      <div className={POSTCARD_CARD_COLUMN}>
        <PostcardTurnButton
          side={side}
          turnToBackHint="Turn over to read the back"
          onClick={() =>
            setSide((current) => (current === 'back' ? 'front' : 'back'))
          }
        />
        <Postcard
          side={side}
          tone={look.tone}
          templateKey={look.templateKey}
          stickers={{ front: stickersOn('front'), back: stickersOn('back') }}
          stamp={
            <>
              {look.stampKey ? (
                <PostcardStampReadOnly stampKey={look.stampKey} />
              ) : (
                <PostcardStampBoxReadOnly />
              )}
              <PostcardPostmarkStill date={sentOn} />
            </>
          }
        >
          {back}
        </Postcard>
      </div>

      {/* Hidden rather than taken out, so the card stays where it is as it turns over. */}
      {pager && (
        <PostcardAnswerPager
          {...pager}
          onIndexChange={setAnswerIndex}
          className={cn(side === 'front' && 'invisible')}
        />
      )}
    </div>
  );
}
