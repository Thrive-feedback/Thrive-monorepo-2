'use client';

import { useState } from 'react';
import { Dialog } from '@/components/atoms/dialog';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type { KudosDraft } from './kudos-draft.type';
import { KudosEditor } from './kudos-editor';

export type KudosDialogProps = {
  /** What is being written, above the card. */
  title: string;
  /** Who `@` offers, which is who it can be for: the Workspace but the writer. */
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  /** What is already written as it opens, as typed before choosing this card. */
  defaultMessage?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Send was pressed: everything on the card. The dialog sends nothing itself. Resolve `true` once
   * it has gone: the card is then pinned to the board, and the dialog stays open on it until the
   * Giver goes back to Home, so do not close it here. Resolve `false` if it has not: the card stays
   * open as it was, and saying why is the caller's.
   */
  onSend: (kudos: KudosDraft) => Promise<boolean>;
  /**
   * Closed. Focus goes back to whatever had it when the card opened; prevent the default to send
   * it somewhere else, as when that control has gone, like an item in a menu that has closed.
   */
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * A Kudos written on a portrait card in front of the page: one side, the words in the middle of it,
 * and whoever they @mention is who it is for; if they mention nobody, it is for the whole
 * Workspace. Under the card, a row of small cards chooses the
 * template, above a bar of stickers beside Send; while the message has the cursor the bar holds the
 * text's tools, and Send is gone. A button beside the card hides the stickers, which still go with
 * it.
 *
 * Every opening is a blank card. Closing — Close or Escape — always asks first, and nothing outside
 * the card closes it. Sent, the card is pinned to a board, which stays with a way on from it until
 * the Giver takes one.
 */
export function KudosDialog({
  title,
  teammates,
  workspaceGoals,
  defaultMessage = '',
  open,
  onOpenChange,
  onSend,
  onCloseAutoFocus,
}: KudosDialogProps) {
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
      <KudosEditor
        key={openings}
        title={title}
        teammates={teammates}
        workspaceGoals={workspaceGoals}
        defaultMessage={defaultMessage}
        onSend={onSend}
        onClose={() => onOpenChange(false)}
        onCloseAutoFocus={onCloseAutoFocus}
      />
    </Dialog>
  );
}
