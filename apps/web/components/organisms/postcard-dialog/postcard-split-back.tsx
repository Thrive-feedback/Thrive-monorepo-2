import { memo } from 'react';
import { cn } from '@/lib/cn.util';
import { NO_TEXT_TAGS, type TextTags } from '@/lib/feedback/text-tags.type';
import styles from './postcard.module.css';
import { PostcardFrom } from './postcard-address-read-only';
import type { PostcardAsk, PostcardWriter } from './postcard-draft.type';
import { PostcardMessageReadOnly } from './postcard-message-read-only';
import { messageClassName } from './postcard-message-style.util';
import { DEFAULT_TEXT_STYLE } from './postcard-style.constant';

const half = 'flex min-h-48 min-w-0 flex-col gap-4 p-5 md:min-h-0 md:p-6';

/** The hint on the answer half: body size, so its lines match a message at 16 px. */
const HINT_STYLE = { ...DEFAULT_TEXT_STYLE, sizeStep: 1 };

export type PostcardSplitBackProps = {
  /** The left half: the Ask. */
  ask: React.ReactNode;
  /** The right half: the Answer. */
  answer: React.ReactNode;
};

/**
 * The back of a request postcard, halved by a line down the middle: the Ask on the left, the
 * Answer on the right. On a phone the Ask sits above the Answer.
 */
export function PostcardSplitBack({ ask, answer }: PostcardSplitBackProps) {
  return (
    <div className="grid min-h-0 flex-1 divide-y divide-border-muted md:grid-cols-2 md:divide-x md:divide-y-0">
      <div className={half}>{ask}</div>
      <div className={half}>{answer}</div>
    </div>
  );
}

export type PostcardAnswerFromProps = {
  writer: PostcardWriter;
};

/** Who wrote the answer, heading its half, which holds the stamp's corner from `md`. */
export function PostcardAnswerFrom({ writer }: PostcardAnswerFromProps) {
  return (
    <div className="md:min-h-17.5 md:pe-21">
      <PostcardFrom writer={writer} />
    </div>
  );
}

export type PostcardAskReadOnlyProps = {
  ask: PostcardAsk;
  /** What the Request message was bound to when it was sent, once it has been. */
  messageTags?: TextTags;
};

/**
 * The Ask as its Requester wrote it: who asked, then the Request message in full, printed in the
 * Requester's own style. Only read: there is nothing to edit, and who else was asked is never
 * shown. It never changes, so it is drawn once.
 */
export const PostcardAskReadOnly = memo(function PostcardAskReadOnly({
  ask,
  messageTags = NO_TEXT_TAGS,
}: PostcardAskReadOnlyProps) {
  return (
    <>
      {/* On a phone this half is on top, so the stamp's corner is here. */}
      <div className="min-h-18.5 pe-21 md:min-h-0 md:pe-0">
        <PostcardFrom writer={ask.requester} />
      </div>
      <PostcardMessageReadOnly
        message={ask.message}
        tags={messageTags}
        textStyle={ask.textStyle}
        isRuled={false}
      />
    </>
  );
});

/**
 * The right half while a request is written: lines where the answers will be written, and a
 * faint line saying so, below the stamp in that half's corner. Nothing here can be reached; it
 * shows the asker what the card becomes.
 */
export const PostcardAnswerPlaceholder = memo(
  function PostcardAnswerPlaceholder() {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'flex-1 md:mt-21.5',
          styles.ruled,
          messageClassName(HINT_STYLE),
          'text-fg-disabled italic',
        )}
      >
        Their answer goes here
      </div>
    );
  },
);
