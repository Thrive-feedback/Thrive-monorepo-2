'use client';

import { useRef } from 'react';
import { FeedbackText } from '@/components/organisms/feedback-text';
import type {
  PostcardAskSticker,
  PostcardSide,
} from '@/components/organisms/postcard-dialog/postcard-draft.type';
import { metricsClassName } from '@/components/organisms/postcard-dialog/postcard-message-style.util';
import { PostcardStickerReadOnly } from '@/components/organisms/postcard-dialog/postcard-sticker';
import { POSTCARD_INKS } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { cn } from '@/lib/cn.util';
import type { TextTags } from '@/lib/feedback/text-tags.type';
import styles from './kudos-card.module.css';
import { KudosCardBack } from './kudos-card-back';
import { KudosCardFace } from './kudos-card-face';
import { KudosCardTurn } from './kudos-card-turn';
import type { KudosDraft } from './kudos-draft.type';
import { useFittedSize } from './use-fitted-size';

/** How a sent card looks: everything on it but the words. */
export type KudosCardDrawing = Pick<KudosDraft, 'templateKey' | 'textStyle'> & {
  readonly stickers: readonly PostcardAskSticker[];
};

export type KudosCardReadOnlyProps = {
  message: string;
  /** What the message was bound to when it was sent. */
  tags: TextTags;
  drawing: KudosCardDrawing;
  /** As `kudosCardDate` writes it: the day it was given, on the back. */
  date: string;
  /** The side to show. A change turns the card over to it. */
  side?: PostcardSide;
  /** Leaves the stickers off for now, so what lies under them can be read. */
  areStickersHidden?: boolean;
};

/**
 * A sent Kudos card, exactly as its Giver left it, at whatever width it is given: laid out at the
 * size it was written at and scaled as one piece, so its lines break in the same places and its
 * stickers keep their size against the card. The words are set as `KudosMessage` sets them, as large
 * as fits the card up to the size chosen (ADR 0092), measured at the size it is laid out at, so
 * nothing here depends on how large it is drawn. The back carries the day it was given.
 */
export function KudosCardReadOnly({
  message,
  tags,
  drawing,
  date,
  side = 'front',
  areStickersHidden = false,
}: KudosCardReadOnlyProps) {
  const { templateKey, textStyle, stickers } = drawing;
  const wordsRef = useRef<HTMLParagraphElement>(null);
  const { roomRef, style } = useFittedSize({
    textStyle,
    text: message,
    wordsRef,
  });

  return (
    <div className={cn('relative aspect-3/4 w-full', styles.stage)}>
      <div className={styles.sheet}>
        <KudosCardTurn
          side={side}
          front={
            <KudosCardFace templateKey={templateKey}>
              <div className={cn('absolute inset-0', styles.writing)}>
                <div
                  ref={roomRef}
                  style={style}
                  className="relative flex size-full items-center justify-center"
                >
                  <p
                    ref={wordsRef}
                    className={cn(
                      'w-full whitespace-pre-wrap break-words',
                      metricsClassName(textStyle),
                      styles.fitted,
                      POSTCARD_INKS[textStyle.ink].textClassName,
                      styles.tags,
                    )}
                  >
                    <FeedbackText text={message} tags={tags} />
                  </p>
                </div>
              </div>
              {!areStickersHidden &&
                stickers.map((sticker, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a sent card never changes, and two can sit on one spot.
                  <PostcardStickerReadOnly key={index} sticker={sticker} />
                ))}
            </KudosCardFace>
          }
          back={<KudosCardBack date={date} />}
        />
      </div>
    </div>
  );
}
