'use client';

import { useState } from 'react';
import { Dialog } from '@/components/atoms/dialog';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type { PostcardDraft, PostcardWriter } from './postcard-draft.type';
import { PostcardEditor } from './postcard-editor';

const NOBODY: readonly string[] = [];

export type PostcardDialogProps = {
  /** What is being written, above the card: "Give feedback". */
  title: string;
  /** Who it can be for, and who else can be chosen to read it: the Workspace but the writer. */
  teammates: readonly Teammate[];
  /** Who signs it, after "From". */
  writer: PostcardWriter;
  /** Who it is for as it opens, such as the Member whose page it was opened from. */
  defaultRecipientAccountIds?: readonly string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Seal & Send was pressed: everything on the card, handed over at the press. The dialog sends
   * nothing itself; the card then flies off and the dialog closes itself, so do not close it here.
   * Showing a failure is the caller's: by then the card has gone.
   */
  onSend: (postcard: PostcardDraft) => void;
  /**
   * Closed. Focus goes back to whatever had it when the card opened; prevent the default to send
   * it somewhere else, as when that control has gone, like an item in a menu that has closed.
   */
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * Feedback written on a postcard, in front of the page. The card opens on its back, where the
 * message is written under who it is from and who it is for; its front is a picture, a turn
 * away. Under the card a bar of tools sits beside Seal & Send, and while the message has the
 * cursor the bar holds the text's tools instead.
 *
 * Every opening is a blank card, whatever was on the last one. Closing — Close or Escape —
 * always asks first, and nothing outside the card closes it.
 */
export function PostcardDialog({
  title,
  teammates,
  writer,
  defaultRecipientAccountIds = NOBODY,
  open,
  onOpenChange,
  onSend,
  onCloseAutoFocus,
}: PostcardDialogProps) {
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
        teammates={teammates}
        writer={writer}
        defaultRecipientAccountIds={defaultRecipientAccountIds}
        onSend={onSend}
        onClose={() => onOpenChange(false)}
        onCloseAutoFocus={onCloseAutoFocus}
      />
    </Dialog>
  );
}
