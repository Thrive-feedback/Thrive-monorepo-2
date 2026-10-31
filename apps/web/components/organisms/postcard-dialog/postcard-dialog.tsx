'use client';

import { useState } from 'react';
import { Dialog } from '@/components/atoms/dialog';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type {
  PostcardAnswer,
  PostcardAsk,
  PostcardCard,
  PostcardDraft,
  PostcardKind,
  PostcardWriter,
} from './postcard-draft.type';
import { NOBODY } from './postcard-draft.util';
import { PostcardEditor } from './postcard-editor';

type PostcardDialogCommonProps = {
  /** What is being written, above the card: "Give feedback", "Ask for feedback", "Answer". */
  title: string;
  /** Who writes it: after "From" on the card, or on the answer's half. */
  writer: PostcardWriter;
  /** Who `@` offers, and for a card that chooses, who it can be for: the Workspace but the writer. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
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
  kind?: Exclude<PostcardKind, 'answer'>;
  /** Who it is for, or who is asked, as it opens, such as the Member whose page it was opened from. */
  defaultRecipientAccountIds?: readonly string[];
  /**
   * Send was pressed: everything on the card, handed over once its back is showing. The dialog
   * sends nothing itself. Resolve `true` once it has gone: the card then flies off and the dialog closes itself,
   * so do not close it here. Resolve `false` if it has not: the card stays open as it was, and
   * saying why is the caller's.
   */
  onSend: (postcard: PostcardDraft) => Promise<boolean>;
};

/** Answering one Ask: the Request message is on the left half, the answer is written on the right. */
export type PostcardAnsweringProps = {
  kind: 'answer';
  /** The Ask being answered, as its Requester wrote it. */
  ask: PostcardAsk;
  /** Send answer was pressed: the answer, handed over at the press, as `onSend` above. */
  onSend: (answer: PostcardAnswer) => Promise<boolean>;
};

export type PostcardDialogProps = PostcardDialogCommonProps &
  (PostcardWritingProps | PostcardAnsweringProps);

/**
 * Feedback written on a postcard, in front of the page. The card opens on its back; its front is
 * a picture, a turn away. Under the card a bar of tools sits beside a box holding who else can read
 * it and Send. While the message has the cursor the bar holds the text's tools instead, and the box
 * is gone. Beside Turn over, a button hides every sticker to see what lies under them, and shows
 * them again; hidden stickers still go with the card.
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
  const {
    title,
    writer,
    teammates,
    workspaceGoals,
    open,
    onOpenChange,
    onCloseAutoFocus,
  } = props;
  const card: PostcardCard =
    props.kind === 'answer'
      ? {
          kind: 'answer',
          teammates,
          workspaceGoals,
          ask: props.ask,
          onSend: props.onSend,
        }
      : {
          kind: props.kind ?? 'give',
          teammates,
          workspaceGoals,
          defaultRecipientAccountIds:
            props.defaultRecipientAccountIds ?? NOBODY,
          onSend: props.onSend,
        };

  // A new opening gets a new editor, so its state starts blank. Counted while rendering rather
  // than in an effect, so the first frame of an opening is already the blank card.
  const [openings, setOpenings] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setOpenings((count) => count + 1);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* A new opening, or a different card, gets a new editor: each starts blank and keeps one
          kind for its life. */}
      <PostcardEditor
        key={`${openings}:${card.kind}`}
        title={title}
        writer={writer}
        card={card}
        onClose={() => onOpenChange(false)}
        onCloseAutoFocus={onCloseAutoFocus}
      />
    </Dialog>
  );
}
