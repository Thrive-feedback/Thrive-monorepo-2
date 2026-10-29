'use client';

import { useState } from 'react';
import { Dialog } from '@/components/atoms/dialog';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type {
  PostcardAnswer,
  PostcardAsk,
  PostcardDraft,
  PostcardWriter,
} from './postcard-draft.type';
import { type PostcardCard, PostcardEditor } from './postcard-editor';

const NOBODY: readonly string[] = [];

type PostcardDialogCommonProps = {
  /** What is being written, above the card: "Give feedback", "Ask for feedback", "Answer". */
  title: string;
  /** Who writes it: after "From" on the card, or on the answer's half. */
  writer: PostcardWriter;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Closed. Focus goes back to whatever had it when the card opened; prevent the default to send
   * it somewhere else, as when that control has gone, like an item in a menu that has closed.
   */
  onCloseAutoFocus?: (event: Event) => void;
};

/** Writing Feedback unasked (`give`, the default) or a Feedback Request (`ask`). */
export type PostcardWritingProps = {
  kind?: 'give' | 'ask';
  /** Who it can be for, and who else can be chosen to read it: the Workspace but the writer. */
  teammates: readonly Teammate[];
  /** Who it is for, or who is asked, as it opens, such as the Member whose page it was opened from. */
  defaultRecipientAccountIds?: readonly string[];
  /**
   * Send was pressed: everything on the card, handed over at the press. The dialog sends nothing
   * itself; the card then flies off and the dialog closes itself, so do not close it here.
   * Showing a failure is the caller's: by then the card has gone.
   */
  onSend: (postcard: PostcardDraft) => void;
};

/** Answering one Ask: the Request message is on the left half, the answer is written on the right. */
export type PostcardAnsweringProps = {
  kind: 'answer';
  /** The Ask being answered, as its Requester wrote it. */
  ask: PostcardAsk;
  /** Send answer was pressed: the answer, handed over at the press, as `onSend` above. */
  onSend: (answer: PostcardAnswer) => void;
};

export type PostcardDialogProps = PostcardDialogCommonProps &
  (PostcardWritingProps | PostcardAnsweringProps);

/**
 * Feedback written on a postcard, in front of the page. The card opens on its back; its front is
 * a picture, a turn away. Under the card a bar of tools sits beside Send, and while the message
 * has the cursor the bar holds the text's tools instead.
 *
 * - `give` (the default): one full back, the message under who it is from and who it is for.
 * - `ask`: the back halved, the Request message written on the left under From and To, and the
 *   right left for the answers, untouchable.
 * - `answer`: the same halved back, the Ask read-only on the left and the answer written on the
 *   right under the writer's name.
 *
 * Every opening is a blank card, whatever was on the last one. Closing — Close or Escape —
 * always asks first, and nothing outside the card closes it.
 */
export function PostcardDialog(props: PostcardDialogProps) {
  const { title, writer, open, onOpenChange, onCloseAutoFocus } = props;
  const card: PostcardCard =
    props.kind === 'answer'
      ? { kind: 'answer', ask: props.ask, onSend: props.onSend }
      : {
          kind: props.kind ?? 'give',
          teammates: props.teammates,
          defaultRecipientAccountIds:
            props.defaultRecipientAccountIds ?? NOBODY,
          onSend: props.onSend,
        };

  // A new opening gets a new editor, so its state starts blank. Counted while rendering rather
  // than in an effect, so the first frame of an opening is already the blank card.
  const [opening, setOpening] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setOpening((count) => count + 1);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PostcardEditor
        key={opening}
        title={title}
        writer={writer}
        card={card}
        onClose={() => onOpenChange(false)}
        onCloseAutoFocus={onCloseAutoFocus}
      />
    </Dialog>
  );
}
