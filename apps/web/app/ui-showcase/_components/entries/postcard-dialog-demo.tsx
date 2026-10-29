'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { LETTER_TEAMMATES } from '@/app/ui-showcase/letter/_components/letter-teammates.mock';
import { Button } from '@/components/atoms/button';
import { PostcardDialog } from '@/components/organisms/postcard-dialog/postcard-dialog';
import type { PostcardDraft } from '@/components/organisms/postcard-dialog/postcard-draft.type';

const WRITER = { name: 'Ann', photoUrl: null };

export type PostcardDialogDemoProps = {
  /** What the button opening it says, which is also the dialog's title. */
  title: string;
  defaultRecipientAccountIds?: readonly string[];
};

/**
 * Client-only because the dialog is opened from a button here. Seal & Send only says what would
 * have been sent: the showcase reaches no Workspace.
 */
export function PostcardDialogDemo({
  title,
  defaultRecipientAccountIds,
}: PostcardDialogDemoProps) {
  const [open, setOpen] = useState(false);

  function handleSend(postcard: PostcardDraft) {
    toast.success('Seal & Send pressed.', {
      description: `For ${postcard.recipientAccountIds.length} ${postcard.recipientAccountIds.length === 1 ? 'person' : 'people'}, ${postcard.message.length} characters, on ${postcard.tone} paper.`,
    });
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        {title}
      </Button>
      <PostcardDialog
        title={title}
        teammates={LETTER_TEAMMATES}
        writer={WRITER}
        defaultRecipientAccountIds={defaultRecipientAccountIds}
        open={open}
        onOpenChange={setOpen}
        onSend={handleSend}
      />
    </>
  );
}
