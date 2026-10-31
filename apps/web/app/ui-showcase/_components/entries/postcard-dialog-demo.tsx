'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { LETTER_TEAMMATES } from '@/app/ui-showcase/letter/_components/letter-teammates.mock';
import { Button } from '@/components/atoms/button';
import { PostcardDialog } from '@/components/organisms/postcard-dialog/postcard-dialog';
import { SAMPLE_ASK } from './postcard-samples.mock';

const WRITER = { name: 'Ann', photoUrl: null };

const SAMPLE_WORKSPACE_GOALS = ['Ownership', 'CustomerFirst'];

/** "Mali Sombat, Krit Chan and Ann Lee": the names as a sentence says them, no Oxford comma. */
const NAMES = new Intl.ListFormat('en-GB', {
  style: 'long',
  type: 'conjunction',
});

/** Says who the card went to, as the real app would once it has been sent. */
function toastSent(names: readonly string[]) {
  toast.success(`Sent to ${NAMES.format(names)} successfully.`);
}

export type PostcardDialogDemoProps = {
  /** What the button opening it says, which is also the dialog's title. */
  title: string;
  kind?: 'give' | 'ask' | 'answer';
  defaultRecipientAccountIds?: readonly string[];
};

/**
 * Client-only because the dialog is opened from a button here. Send only says what would have
 * been sent: the showcase reaches no Workspace.
 */
export function PostcardDialogDemo({
  title,
  kind = 'give',
  defaultRecipientAccountIds,
}: PostcardDialogDemoProps) {
  const [open, setOpen] = useState(false);
  const common = {
    title,
    writer: WRITER,
    teammates: LETTER_TEAMMATES,
    workspaceGoals: SAMPLE_WORKSPACE_GOALS,
    open,
    onOpenChange: setOpen,
  };

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        {title}
      </Button>
      {kind === 'answer' ? (
        <PostcardDialog
          {...common}
          kind="answer"
          ask={SAMPLE_ASK}
          onSend={async () => {
            toastSent([SAMPLE_ASK.requester.name]);
            return true;
          }}
        />
      ) : (
        <PostcardDialog
          {...common}
          kind={kind}
          defaultRecipientAccountIds={defaultRecipientAccountIds}
          onSend={async (postcard) => {
            toastSent(
              LETTER_TEAMMATES.filter((teammate) =>
                postcard.recipientAccountIds.includes(teammate.accountId),
              ).map((teammate) => teammate.name),
            );
            return true;
          }}
        />
      )}
    </>
  );
}
