import { memo } from 'react';
import { cn } from '@/lib/cn.util';
import styles from './postcard.module.css';
import { PostcardFrom } from './postcard-address';
import type { PostcardAsk } from './postcard-draft.type';
import { messageClassName } from './postcard-message';
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

export type PostcardAskReadOnlyProps = {
  ask: PostcardAsk;
};

/**
 * The Ask as its Requester wrote it, for the person answering: who asked, then the Request
 * message in full, printed in the Requester's own style. Only read: there is nothing to edit,
 * and who else was asked is never shown. It never changes, so it is drawn once.
 */
export const PostcardAskReadOnly = memo(function PostcardAskReadOnly({
  ask,
}: PostcardAskReadOnlyProps) {
  return (
    <>
      <PostcardFrom writer={ask.requester} />
      <p
        className={cn(
          'min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap',
          messageClassName(ask.textStyle),
        )}
      >
        {ask.message}
      </p>
    </>
  );
});

/**
 * The right half while a request is written: lines where the answers will be written, and a
 * faint line saying so. Nothing here can be reached; it shows the asker what the card becomes.
 */
export const PostcardAnswerPlaceholder = memo(
  function PostcardAnswerPlaceholder() {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'flex-1',
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
